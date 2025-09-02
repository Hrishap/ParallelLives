import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../utils/logger';
import { ExternalAPIError } from '@/types';
import { cacheService } from './cache';

interface ClimateData {
  latitude: number;
  longitude: number;
  elevation: number;
  daily: {
    time: string[];
    temperature_2m_mean: number[];
    precipitation_sum: number[];
    sunshine_duration: number[];
    wind_speed_10m_max: number[];
  };
}

interface ClimateMetrics {
  avgTempC: number;
  avgTempF: number;
  rainDays: number;
  sunnyDays: number;
  season: string;
  comfortIndex: number;
}

class ClimateService {
  private client: AxiosInstance;
  private baseURL = 'https://archive-api.open-meteo.com/v1';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ParallelLives/1.0 (contact@parallellives.com)'
      }
    });

    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response?.status !== undefined && error.response.status >= 500 && error.response.status < 600);
      }
    });
  }

  async getClimateMetrics(latitude: number, longitude: number): Promise<ClimateMetrics> {
    try {
      const cacheKey = `climate:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
      const cached = await cacheService.get<ClimateMetrics>(cacheKey);
      if (cached) return cached;

      logger.info(`Getting climate data for coordinates: ${latitude}, ${longitude}`);

      // Get climate normals (30-year averages)
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear - 1}-01-01`;
      const endDate = `${currentYear - 1}-12-31`;

      const response = await this.client.get('/archive', {
        params: {
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          start_date: startDate,
          end_date: endDate,
          daily: [
            'temperature_2m_mean',
            'precipitation_sum',
            'sunshine_duration',
            'wind_speed_10m_max'
          ].join(','),
          timezone: 'UTC'
        }
      });

      const data: ClimateData = response.data;
      const metrics = this.calculateClimateMetrics(data);

      await cacheService.set(cacheKey, metrics, 7 * 24 * 60 * 60 * 1000); // 7 days
      return metrics;
    } catch (error) {
      logger.error('Climate API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalAPIError(`Failed to get climate data: ${errorMessage}`, 'open-meteo');
    }
  }

  async getCoordinatesFromCity(cityName: string, countryName?: string): Promise<{ latitude: number; longitude: number }> {
    try {
      const cacheKey = `geocode:${cityName}:${countryName || 'any'}`;
      const cached = await cacheService.get<{ latitude: number; longitude: number }>(cacheKey);
      if (cached) return cached;

      // Use OpenStreetMap Nominatim for geocoding (free, no API key required)
      const query = countryName ? `${cityName}, ${countryName}` : cityName;
      
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'ParallelLives/1.0 (contact@parallellives.com)'
        },
        timeout: 5000
      });

      if (!response.data || response.data.length === 0) {
        throw new ExternalAPIError(`Coordinates not found for city: ${query}`, 'nominatim', 404);
      }

      const result = response.data[0];
      const coordinates = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      };

      await cacheService.set(cacheKey, coordinates, 30 * 24 * 60 * 60 * 1000); // 30 days
      return coordinates;
    } catch (error) {
      logger.error('Geocoding error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalAPIError(`Failed to geocode city: ${errorMessage}`, 'geocoding');
    }
  }

  private calculateClimateMetrics(data: ClimateData): ClimateMetrics {
    const temps = data.daily.temperature_2m_mean || [];
    const precipitation = data.daily.precipitation_sum || [];
    const sunshine = data.daily.sunshine_duration || [];

    // Calculate averages with safety checks
    const avgTempC = temps.length > 0 ? temps.reduce((sum, temp) => sum + (temp || 0), 0) / temps.length : 15;
    const avgTempF = (avgTempC * 9/5) + 32;

    // Count rainy days (> 1mm precipitation)
    const rainDays = precipitation.filter(precip => (precip || 0) > 1).length;

    // Count sunny days (> 8 hours of sunshine)
    const sunnyDays = sunshine.filter(sun => (sun || 0) > 8 * 3600).length; // sunshine in seconds

    // Determine season based on current date (month is 0-11)
    const now = new Date();
    const month = now.getMonth();
    let season = 'winter'; // default
    if (month >= 2 && month <= 4) season = 'spring';  // Mar-May
    else if (month >= 5 && month <= 7) season = 'summer';  // Jun-Aug
    else if (month >= 8 && month <= 10) season = 'autumn';  // Sep-Nov
    else season = 'winter';  // Dec-Feb

    // Calculate comfort index (0-10)
    // Based on temperature range 15-25°C being most comfortable
    let tempComfort = 10;
    if (avgTempC < 10 || avgTempC > 30) tempComfort = 3;
    else if (avgTempC < 15 || avgTempC > 25) tempComfort = 7;

    const totalDays = Math.max(1, temps.length); // Avoid division by zero
    const rainComfort = Math.max(0, 10 - (rainDays / totalDays * 20)); // Penalize excessive rain
    const sunComfort = Math.min(10, sunnyDays / totalDays * 20); // Reward sunshine

    const comfortIndex = Math.round((tempComfort + rainComfort + sunComfort) / 3 * 10) / 10;

    return {
      avgTempC: Math.round(avgTempC * 10) / 10,
      avgTempF: Math.round(avgTempF * 10) / 10,
      rainDays,
      sunnyDays,
      season,
      comfortIndex: Math.max(0, Math.min(10, comfortIndex))
    };
  }
}

export const climateService = new ClimateService();