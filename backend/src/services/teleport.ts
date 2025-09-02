import axios, { AxiosInstance, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../utils/logger';
import { ExternalAPIError } from '@/types';
import { ICityMetrics } from '@/models/LifeNode';
import { cacheService } from './cache';

interface TeleportUrbanArea {
  _links: {
    self: { href: string };
    'ua:images': { href: string };
    'ua:scores': { href: string };
    'ua:details': { href: string };
  };
  full_name: string;
  name: string;
  slug: string;
  teleport_city_url?: string;
}

interface TeleportCity {
  _links: {
    self: { href: string };
    'city:urban_area'?: { href: string };
    'city:admin1_division'?: { href: string };
    'city:country'?: { href: string };
  };
  full_name: string;
  name: string;
  matching_alternate_names?: Array<{
    name: string;
  }>;
}

interface TeleportCitiesResponse {
  _embedded: {
    'city:search-results': TeleportCity[];
  };
  _links: {
    self: { href: string };
  };
  count: number;
}

interface TeleportScore {
  name: string;
  score_out_of_10: number;
}

interface TeleportScores {
  categories: TeleportScore[];
  summary: {
    score: number;
  };
}

interface TeleportDetails {
  categories: Array<{
    id: string;
    name: string;
    data: Array<{
      type: string;
      name: string;
      id: string;
      value: number;
      currency_dollar_value?: number;
    }>;
  }>;
}

class TeleportService {
  private client: AxiosInstance;
  private baseURL = 'https://api.teleport.org/api';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ParallelLives/1.0'
      }
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response?.status !== undefined && error.response.status >= 500 && error.response.status < 600);
      }
    });
  }

  async searchCities(query: string): Promise<TeleportUrbanArea[]> {
    try {
      const cacheKey = `teleport:search:${query.toLowerCase()}`;
      const cached = await cacheService.get<TeleportUrbanArea[]>(cacheKey);
      if (cached) return cached;

      logger.info(`Searching cities for: ${query}`);
      
      // Use the correct cities search endpoint
      const response: AxiosResponse<TeleportCitiesResponse> = await this.client.get('/cities/', {
        params: { search: query }
      });

      const cities = response.data._embedded?.['city:search-results'] || [];
      
      // Convert cities to urban areas by following the urban_area links
      const urbanAreas: TeleportUrbanArea[] = [];
      
      for (const city of cities) {
        if (city._links['city:urban_area']) {
          try {
            const urbanAreaResponse: AxiosResponse<TeleportUrbanArea> = await this.client.get(
              city._links['city:urban_area'].href.replace(this.baseURL, '')
            );
            urbanAreas.push(urbanAreaResponse.data);
          } catch (error) {
            logger.warn(`Failed to fetch urban area for city ${city.name}:`, error);
            // Continue with other cities even if one fails
          }
        }
      }
      
      await cacheService.set(cacheKey, urbanAreas, 24 * 60 * 60 * 1000); // 24 hours
      return urbanAreas;
    } catch (error) {
      logger.error('Teleport API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalAPIError(`Failed to search cities: ${errorMessage}`, 'teleport');
    }
  }

  async getCityMetrics(cityName: string, countryName?: string): Promise<ICityMetrics> {
    try {
      const cacheKey = `teleport:metrics:${cityName}:${countryName || 'any'}`;
      const cached = await cacheService.get<ICityMetrics>(cacheKey);
      if (cached) return cached;

      logger.info(`Getting city metrics for: ${cityName}, ${countryName || 'any country'}`);

      // First, find the urban area using the corrected search
      const urbanAreas = await this.searchCities(cityName);
      
      let targetUrbanArea: TeleportUrbanArea | undefined;
      
      if (countryName) {
        // If country is specified, try to find a more specific match
        targetUrbanArea = urbanAreas.find(ua => {
          const nameMatch = ua.name.toLowerCase().includes(cityName.toLowerCase()) ||
                           ua.full_name.toLowerCase().includes(cityName.toLowerCase());
          const countryMatch = ua.full_name.toLowerCase().includes(countryName.toLowerCase());
          return nameMatch && countryMatch;
        });
      }
      
      // Fallback to any city name match
      if (!targetUrbanArea) {
        targetUrbanArea = urbanAreas.find(ua => 
          ua.name.toLowerCase().includes(cityName.toLowerCase()) ||
          ua.full_name.toLowerCase().includes(cityName.toLowerCase())
        );
      }

      // Last resort: take the first result if available
      if (!targetUrbanArea && urbanAreas.length > 0) {
        targetUrbanArea = urbanAreas[0];
        logger.warn(`Using first search result for ${cityName}: ${targetUrbanArea!.name}`);
      }

      if (!targetUrbanArea) {
        throw new ExternalAPIError(`City not found: ${cityName}`, 'teleport', 404);
      }

      // Get scores and details in parallel
      const [scores, details] = await Promise.all([
        this.getCityScores(targetUrbanArea.slug),
        this.getCityDetails(targetUrbanArea.slug)
      ]);

      const metrics: ICityMetrics = {
        name: targetUrbanArea.name,
        country: countryName || this.extractCountryFromDetails(details),
        teleportScores: this.mapTeleportScores(scores),
        population: this.extractPopulation(details),
        timezone: this.extractTimezone(details)
      };

      await cacheService.set(cacheKey, metrics, 24 * 60 * 60 * 1000); // 24 hours
      return metrics;
    } catch (error) {
      logger.error('Teleport metrics error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalAPIError(`Failed to get city metrics: ${errorMessage}`, 'teleport');
    }
  }

  private async getCityScores(slug: string): Promise<TeleportScores> {
    const response: AxiosResponse = await this.client.get(`/urban_areas/slug:${slug}/scores/`);
    return response.data;
  }

  private async getCityDetails(slug: string): Promise<TeleportDetails> {
    const response: AxiosResponse = await this.client.get(`/urban_areas/slug:${slug}/details/`);
    return response.data;
  }

  private mapTeleportScores(scores: TeleportScores) {
    const scoreMap = scores.categories.reduce((acc, cat) => {
      const key = this.normalizeScoreKey(cat.name);
      acc[key] = Math.round(cat.score_out_of_10 * 10) / 10; // Round to 1 decimal
      return acc;
    }, {} as any);

    return {
      overall: Math.round(scores.summary.score * 10) / 10,
      costOfLiving: scoreMap.costOfLiving || 5,
      safety: scoreMap.safety || 5,
      housing: scoreMap.housing || 5,
      healthcare: scoreMap.healthcare || 5,
      education: scoreMap.education || 5,
      leisure: scoreMap.leisure || 5,
      tolerance: scoreMap.tolerance || 5,
      commute: scoreMap.commute || 5,
      business: scoreMap.business || 5,
      economy: scoreMap.economy || 5
    };
  }

  private normalizeScoreKey(categoryName: string): string {
    const keyMap: { [key: string]: string } = {
      'Cost of Living': 'costOfLiving',
      'Safety': 'safety',
      'Housing': 'housing',
      'Healthcare': 'healthcare',
      'Education': 'education',
      'Leisure & Culture': 'leisure',
      'Tolerance': 'tolerance',
      'Commute': 'commute',
      'Business Freedom': 'business',
      'Economy': 'economy'
    };
    return keyMap[categoryName] || categoryName.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private extractCountryFromDetails(details: TeleportDetails): string {
    const countryCategory = details.categories.find(cat => cat.id === 'GEOGRAPHY');
    if (countryCategory) {
      const countryData = countryCategory.data.find(item => item.id === 'COUNTRY');
      if (countryData) return countryData.name;
    }
    return 'Unknown';
  }

  private extractPopulation(details: TeleportDetails): number | undefined {
    const demographicsCategory = details.categories.find(cat => cat.id === 'DEMOGRAPHICS');
    if (demographicsCategory) {
      const populationData = demographicsCategory.data.find(item => item.id === 'POPULATION');
      if (populationData) return populationData.value;
    }
    return undefined;
  }

  private extractTimezone(details: TeleportDetails): string | undefined {
    const geographyCategory = details.categories.find(cat => cat.id === 'GEOGRAPHY');
    if (geographyCategory) {
      const timezoneData = geographyCategory.data.find(item => item.id === 'TIMEZONE');
      if (timezoneData) return timezoneData.name;
    }
    return undefined;
  }
}

export const teleportService = new TeleportService();