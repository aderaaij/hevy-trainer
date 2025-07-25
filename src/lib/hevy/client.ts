import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { HevyApiError } from './types/workouts';

/**
 * Client-side HTTP client that proxies requests through our API routes
 * This keeps the API key secure on the server side
 */
export class HevyApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/hevy', // Use our API routes instead of direct Hevy API
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        const apiError: HevyApiError = {
          message: error.response?.data?.error || error.message || 'An unknown error occurred',
          status: error.response?.status || 500,
          code: error.response?.data?.code,
        };

        // Log error for debugging (in development)
        if (process.env.NODE_ENV === 'development') {
          console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: apiError.status,
            message: apiError.message,
          });
        }

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

// Export singleton instance
export const hevyApiClient = new HevyApiClient();