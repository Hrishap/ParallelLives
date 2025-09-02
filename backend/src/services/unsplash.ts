import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../utils/logger';
import { ExternalAPIError } from '@/types';
import { cacheService } from './cache';

interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
    profile_image: {
      small: string;
      medium: string;
      large: string;
    };
    links: {
      html: string;
    };
  };
  description?: string;
  alt_description?: string;
  tags?: Array<{ title: string }>;
  links: {
    html: string;
    download: string;
  };
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}

class UnsplashService {
  private client: AxiosInstance;
  private accessKey: string;

  constructor() {
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY || '';
    if (!this.accessKey) {
      logger.warn('UNSPLASH_ACCESS_KEY not provided - image search will be disabled');
    }

    this.client = axios.create({
      baseURL: 'https://api.unsplash.com',
      timeout: 10000,
      headers: {
        'Authorization': `Client-ID ${this.accessKey}`,
        'Accept': 'application/json',
        'User-Agent': 'ParallelLives/1.0'
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

  async searchImages(query: string, count: number = 1): Promise<UnsplashImage[]> {
    if (!this.accessKey) {
      logger.warn('Unsplash access key not configured, returning placeholder images');
      return this.generatePlaceholderImages(query, count);
    }

    try {
      const cacheKey = `unsplash:${query}:${count}`;
      const cached = await cacheService.get<UnsplashImage[]>(cacheKey);
      if (cached) return cached;

      logger.info(`Searching Unsplash for: ${query} (count: ${count})`);

      const response = await this.client.get<UnsplashSearchResponse>('/search/photos', {
        params: {
          query,
          per_page: Math.min(count, 30),
          orientation: 'landscape',
          content_filter: 'high',
          order_by: 'relevant'
        }
      });

      if (!response.data.results || response.data.results.length === 0) {
        logger.warn(`No images found for query: ${query}`);
        return this.generatePlaceholderImages(query, count);
      }

      const images = response.data.results.slice(0, count);
      
      // Trigger download tracking for Unsplash attribution
      this.trackDownloads(images);

      await cacheService.set(cacheKey, images, 24 * 60 * 60 * 1000); // 24 hours
      return images;
    } catch (error) {
      logger.error(`Unsplash search error for "${query}":`, error);
      
      if (error instanceof Error && 'response' in error && (error as any).response?.status === 403) {
        logger.warn('Unsplash API rate limit exceeded');
        return this.generatePlaceholderImages(query, 1);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalAPIError(`Failed to search images: ${errorMessage}`, 'unsplash');
    }
  }

  async getCoverImage(cityName: string, occupation: string, lifestyle?: string): Promise<{
    url: string;
    credit: string;
    description: string;
  }> {
    try {
      const searchTerms = [cityName, occupation, lifestyle].filter(Boolean);
      const query = searchTerms.join(' ');
      
      const images = await this.searchImages(query, 1);
      
      if (images.length === 0) {
        return this.generatePlaceholderCover(query);
      }

      const image = images[0];
      return {
        url: image?.urls.regular || '',
        credit: `Photo by ${image?.user.name || 'Unknown'} on Unsplash`,
        description: image?.description || image?.alt_description || `${cityName} lifestyle`
      };
    } catch (error) {
      logger.error('Error getting cover image:', error);
      return this.generatePlaceholderCover(`${cityName} ${occupation}`);
    }
  }

  async getLifestyleImages(
    cityName: string, 
    occupation: string, 
    categories: ('lifestyle' | 'city' | 'work' | 'nature')[] = ['lifestyle', 'city']
  ): Promise<Array<{
    url: string;
    credit: string;
    description: string;
    category: 'lifestyle' | 'city' | 'work' | 'nature';
  }>> {
    try {
      const images: Array<{
        url: string;
        credit: string;
        description: string;
        category: 'lifestyle' | 'city' | 'work' | 'nature';
      }> = [];

      for (const category of categories) {
        const query = this.buildCategoryQuery(cityName, occupation, category);
        const categoryImages = await this.searchImages(query, 1);
        
        if (categoryImages.length > 0) {
          const image = categoryImages[0];
          images.push({
            url: image?.urls.regular || '',
            credit: `Photo by ${image?.user.name || 'Unknown'} on Unsplash`,
            description: image?.description || image?.alt_description || `${category} in ${cityName}`,
            category
          });
        }
      }

      return images;
    } catch (error) {
      logger.error('Error getting lifestyle images:', error);
      return [];
    }
  }

  private buildCategoryQuery(cityName: string, occupation: string, category: string): string {
    const queries = {
      lifestyle: `${cityName} lifestyle daily life`,
      city: `${cityName} architecture cityscape`,
      work: `${occupation} workplace professional`,
      nature: `${cityName} nature outdoor parks`
    };
    return (queries as Record<string, string>)[category] || `${cityName} ${category}`;
  }

  private async trackDownloads(images: UnsplashImage[]): Promise<void> {
    try {
      // Track downloads for Unsplash API requirements
      const trackingPromises = images.map(image => 
        this.client.get(`/photos/${image.id}/download`).catch(error => {
          logger.warn(`Failed to track download for image ${image.id}:`, error.message);
        })
      );
      
      await Promise.all(trackingPromises);
    } catch (error) {
      logger.warn('Error tracking image downloads:', error);
    }
  }

  private generatePlaceholderImages(query: string, count: number): UnsplashImage[] {
    const placeholders: UnsplashImage[] = [];
    
    for (let i = 0; i < count; i++) {
      const width = 800;
      const height = 600;
      const seed = encodeURIComponent(query + i);
      
      placeholders.push({
        id: `placeholder-${i}`,
        urls: {
          raw: `https://picsum.photos/seed/${seed}/${width}/${height}`,
          full: `https://picsum.photos/seed/${seed}/${width}/${height}`,
          regular: `https://picsum.photos/seed/${seed}/${width}/${height}`,
          small: `https://picsum.photos/seed/${seed}/400/300`,
          thumb: `https://picsum.photos/seed/${seed}/200/150`
        },
        user: {
          id: 'placeholder',
          username: 'placeholder',
          name: 'Lorem Picsum',
          profile_image: {
            small: 'https://picsum.photos/32/32',
            medium: 'https://picsum.photos/64/64',
            large: 'https://picsum.photos/128/128'
          },
          links: {
            html: 'https://picsum.photos/'
          }
        },
        description: `Placeholder image for ${query}`,
        alt_description: `Placeholder image for ${query}`,
        links: {
          html: 'https://picsum.photos/',
          download: `https://picsum.photos/seed/${seed}/${width}/${height}`
        }
      });
    }
    
    return placeholders;
  }

  private generatePlaceholderCover(query: string): {
    url: string;
    credit: string;
    description: string;
  } {
    const seed = encodeURIComponent(query);
    return {
      url: `https://picsum.photos/seed/${seed}/800/600`,
      credit: 'Photo by Lorem Picsum',
      description: `Placeholder image for ${query}`
    };
  }
}

export const unsplashService = new UnsplashService();