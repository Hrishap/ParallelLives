import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'sonner';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        const message = error.response?.data?.error || error.message || 'An error occurred';
        
        // Don't show toast for certain status codes
        if (error.response?.status !== 404) {
          toast.error(message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Session endpoints
  async createSession(data: {
    title: string;
    description?: string;
    baseContext?: any;
    initialChoice: any;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/sessions', data);
    return response.data;
  }

  async getSession(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`/sessions/${id}`);
    return response.data;
  }

  async getSessionTree(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`/sessions/${id}/tree`);
    return response.data;
  }

  async getSessions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse> {
    const response = await this.client.get('/sessions', { params });
    return response.data;
  }

  async updateSession(id: string, data: any): Promise<ApiResponse> {
    const response = await this.client.put(`/sessions/${id}`, data);
    return response.data;
  }

  async deleteSession(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/sessions/${id}`);
    return response.data;
  }

  // Node endpoints
  async createNode(sessionId: string, data: {
    parentNodeId?: string;
    choice: any;
    userPreferences?: any;
  }): Promise<ApiResponse> {
    const response = await this.client.post(`/nodes/session/${sessionId}`, data);
    return response.data;
  }

  async getNode(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`/nodes/${id}`);
    return response.data;
  }

  async exportNode(id: string, format: 'pdf' | 'json' = 'pdf'): Promise<Blob> {
    const response = await this.client.get(`/nodes/${id}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  // Health check
  async getHealth(): Promise<ApiResponse> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const api = new ApiClient();

// React Query hooks
export interface CreateSessionData {
  title: string;
  description?: string;
  baseContext?: any;
  initialChoice: any;
}

export interface CreateNodeData {
  parentNodeId?: string;
  choice: any;
  userPreferences?: any;
}