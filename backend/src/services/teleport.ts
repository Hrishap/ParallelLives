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

interface TeleportSearchResult {
  matching_full_name: string;
  _links: {
    'city:item': { href: string };
  };
}

interface TeleportCitiesResponse {
  _embedded: {
    'city:search-results': TeleportSearchResult[];
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
  summary: string;
  teleport_city_score: number;
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

      const searchResults = response.data._embedded?.['city:search-results'] || [];
      
      // Convert search results to cities, then to urban areas
      const urbanAreas: TeleportUrbanArea[] = [];
      
      for (const result of searchResults) {
        try {
          // First get the city details from city:item link
          const cityHref = result._links['city:item'].href;
          const cityPath = cityHref.startsWith(this.baseURL) ? cityHref.replace(this.baseURL, '') : cityHref;
          const cityResponse: AxiosResponse<TeleportCity> = await this.client.get(cityPath);
          const city = cityResponse.data;
          
          // Then get the urban area if available
          if (city._links['city:urban_area']) {
            const urbanAreaHref = city._links['city:urban_area'].href;
            const urbanAreaPath = urbanAreaHref.startsWith(this.baseURL) ? urbanAreaHref.replace(this.baseURL, '') : urbanAreaHref;
            const urbanAreaResponse: AxiosResponse<TeleportUrbanArea> = await this.client.get(urbanAreaPath);
            urbanAreas.push(urbanAreaResponse.data);
          }
        } catch (error) {
          logger.warn(`Failed to fetch urban area for search result ${result.matching_full_name}:`, error);
          // Continue with other results even if one fails
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

      try {
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
          throw new Error(`City not found: ${cityName}`);
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
      } catch (teleportError) {
        // Teleport API is down, return mock data
        logger.warn(`Teleport API unavailable for ${cityName}, using fallback data`);
        return this.generateFallbackMetrics(cityName, countryName);
      }
    } catch (error) {
      logger.error('Teleport metrics error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalAPIError(`Failed to get city metrics: ${errorMessage}`, 'teleport');
    }
  }

  private async getCityScores(slug: string): Promise<TeleportScores> {
    try {
      const response: AxiosResponse = await this.client.get(`/urban_areas/slug:${slug}/scores/`);
      return response.data;
    } catch (error) {
      logger.warn(`Failed to get scores for ${slug}, using defaults`);
      // Return default scores if API fails
      return {
        categories: [],
        summary: 'No data available',
        teleport_city_score: 5.0
      };
    }
  }

  private async getCityDetails(slug: string): Promise<TeleportDetails> {
    try {
      const response: AxiosResponse = await this.client.get(`/urban_areas/slug:${slug}/details/`);
      return response.data;
    } catch (error) {
      logger.warn(`Failed to get details for ${slug}, using defaults`);
      // Return empty details if API fails
      return {
        categories: []
      };
    }
  }

  private mapTeleportScores(scores: TeleportScores) {
    const scoreMap = scores.categories.reduce((acc, cat) => {
      const key = this.normalizeScoreKey(cat.name);
      acc[key] = Math.round(cat.score_out_of_10 * 10) / 10; // Round to 1 decimal
      return acc;
    }, {} as any);

    return {
      overall: Math.round(scores.teleport_city_score * 10) / 10,
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
    const countryCategory = details.categories.find(cat => cat.id.toLowerCase() === 'geography');
    if (countryCategory) {
      const countryData = countryCategory.data.find(item => item.id.toLowerCase() === 'country');
      if (countryData) return countryData.name;
    }
    return 'Unknown';
  }

  private extractPopulation(details: TeleportDetails): number | undefined {
    const demographicsCategory = details.categories.find(cat => cat.id.toLowerCase() === 'demographics');
    if (demographicsCategory) {
      const populationData = demographicsCategory.data.find(item => item.id.toLowerCase() === 'population');
      if (populationData) return populationData.value;
    }
    return undefined;
  }

  private extractTimezone(details: TeleportDetails): string | undefined {
    const geographyCategory = details.categories.find(cat => cat.id.toLowerCase() === 'geography');
    if (geographyCategory) {
      const timezoneData = geographyCategory.data.find(item => item.id.toLowerCase() === 'timezone');
      if (timezoneData) return timezoneData.name;
    }
    return undefined;
  }

  private generateFallbackMetrics(cityName: string, countryName?: string): ICityMetrics {
    logger.info(`Generating fallback metrics for ${cityName}, ${countryName || 'Unknown'}`);
    
    // Generate reasonable fallback scores based on city/country patterns
    const baseScores = {
      overall: 6.0,
      costOfLiving: 5.5,
      safety: 6.5,
      housing: 5.0,
      healthcare: 6.0,
      education: 6.0,
      leisure: 5.5,
      tolerance: 6.0,
      commute: 5.0,
      business: 5.5,
      economy: 5.5
    };

    // Adjust scores based on known patterns for major cities/countries
    if (countryName) {
      const country = countryName.toLowerCase();
      if (['usa', 'united states', 'america'].some(c => country.includes(c))) {
        baseScores.healthcare = 4.5;
        baseScores.education = 7.0;
        baseScores.business = 7.5;
      } else if (['canada'].some(c => country.includes(c))) {
        baseScores.healthcare = 8.0;
        baseScores.safety = 8.0;
        baseScores.tolerance = 8.5;
      } else if (['uk', 'united kingdom', 'england', 'scotland', 'wales'].some(c => country.includes(c))) {
        baseScores.healthcare = 7.5;
        baseScores.education = 7.0;
        baseScores.tolerance = 7.5;
      } else if (['germany', 'france', 'netherlands', 'sweden', 'norway', 'denmark'].some(c => country.includes(c))) {
        baseScores.healthcare = 8.0;
        baseScores.education = 7.5;
        baseScores.safety = 7.5;
        baseScores.tolerance = 8.0;
      }
    }

    // Adjust for major cities
    const city = cityName.toLowerCase();
    if (['new york', 'london', 'paris', 'tokyo', 'singapore'].some(c => city.includes(c))) {
      baseScores.business = Math.min(9.0, baseScores.business + 1.5);
      baseScores.leisure = Math.min(9.0, baseScores.leisure + 1.0);
      baseScores.costOfLiving = Math.max(2.0, baseScores.costOfLiving - 1.0);
    }

    return {
      name: cityName,
      country: countryName || 'Unknown',
      teleportScores: baseScores,
      population: undefined,
      timezone: undefined
    };
  }
}

export const teleportService = new TeleportService();