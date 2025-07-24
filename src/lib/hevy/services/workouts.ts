import { hevyApiClient } from '../client';
import {
  HevyWorkoutsResponse,
  Workout,
  WorkoutFilters,
  WorkoutEventsFilters,
  WorkoutCountResponse,
  HevyWorkoutEventsResponse,
  CreateWorkoutRequest,
  UpdateWorkoutRequest,
} from '../types/workouts';

/**
 * Complete service for Hevy API workout endpoints
 * Based on Postman collection analysis - all endpoints confirmed
 */
export class WorkoutService {
  /**
   * Get a paginated list of workouts
   * @param filters - Optional pagination filters
   */
  async getWorkouts(filters?: WorkoutFilters): Promise<HevyWorkoutsResponse> {
    const params = new URLSearchParams();
    
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/workouts?${queryString}` : '/workouts';
    
    return hevyApiClient.get<HevyWorkoutsResponse>(url);
  }

  /**
   * Get total count of workouts
   */
  async getWorkoutCount(): Promise<WorkoutCountResponse> {
    return hevyApiClient.get<WorkoutCountResponse>('/workouts/count');
  }

  /**
   * Get workout events with filtering
   * @param filters - Optional filters including since timestamp
   */
  async getWorkoutEvents(filters?: WorkoutEventsFilters): Promise<HevyWorkoutEventsResponse> {
    const params = new URLSearchParams();
    
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }
    
    if (filters?.since) {
      params.append('since', filters.since);
    }

    const queryString = params.toString();
    const url = queryString ? `/workouts/events?${queryString}` : '/workouts/events';
    
    return hevyApiClient.get<HevyWorkoutEventsResponse>(url);
  }

  /**
   * Get a single workout by ID
   * @param id - The workout ID (UUID)
   */
  async getWorkout(id: string): Promise<Workout> {
    return hevyApiClient.get<Workout>(`/workouts/${id}`);
  }

  /**
   * Create a new workout
   * @param workout - The workout data to create
   */
  async createWorkout(workout: CreateWorkoutRequest): Promise<Workout> {
    return hevyApiClient.post<Workout>('/workouts', workout);
  }

  /**
   * Update an existing workout
   * @param id - The workout ID to update
   * @param workout - The workout data to update
   */
  async updateWorkout(id: string, workout: UpdateWorkoutRequest): Promise<Workout> {
    return hevyApiClient.put<Workout>(`/workouts/${id}`, workout);
  }

  // Helper methods
  
  /**
   * Get recent workouts (helper method)
   * @param limit - Number of workouts to retrieve (default: 10)
   */
  async getRecentWorkouts(limit: number = 10): Promise<HevyWorkoutsResponse> {
    return this.getWorkouts({ page: 1, pageSize: limit });
  }

  /**
   * Get a specific page of workouts
   * @param page - Page number
   * @param pageSize - Number of items per page
   */
  async getWorkoutsPage(page: number = 1, pageSize: number = 10): Promise<HevyWorkoutsResponse> {
    return this.getWorkouts({ page, pageSize });
  }

  /**
   * Get workout events since a specific date
   * @param since - ISO 8601 timestamp
   * @param limit - Maximum number of events to retrieve
   */
  async getWorkoutEventsSince(since: string, limit: number = 20): Promise<HevyWorkoutEventsResponse> {
    return this.getWorkoutEvents({ since, page: 1, pageSize: limit });
  }

  /**
   * Get all workouts (helper method that fetches all pages)
   * WARNING: This may take a while if there are many workouts
   * Use with caution!
   */
  async getAllWorkouts(): Promise<Workout[]> {
    const allWorkouts: Workout[] = [];
    let currentPage = 1;
    let totalPages = 1;
    
    do {
      const response = await this.getWorkouts({
        page: currentPage,
        pageSize: 100, // Maximum to reduce requests
      });
      
      allWorkouts.push(...response.workouts);
      totalPages = response.page_count;
      currentPage++;
    } while (currentPage <= totalPages);
    
    return allWorkouts;
  }
}

// Export singleton instance
export const workoutService = new WorkoutService();