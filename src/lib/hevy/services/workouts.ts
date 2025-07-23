import { hevyApiClient } from '../client';
import {
  HevyWorkoutsResponse,
  Workout,
  WorkoutFilters,
  CreateWorkoutRequest,
  UpdateWorkoutRequest,
} from '../types/workouts';

/**
 * Service for managing workouts via the Hevy API
 */
export class WorkoutService {
  /**
   * Get a paginated list of workouts
   * @param filters - Optional filters for the request
   */
  async getWorkouts(filters?: WorkoutFilters): Promise<HevyWorkoutsResponse> {
    const params = new URLSearchParams();
    
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }
    
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }

    const queryString = params.toString();
    const url = queryString ? `/workouts?${queryString}` : '/workouts';
    
    return hevyApiClient.get<HevyWorkoutsResponse>(url);
  }

  /**
   * Get a single workout by ID
   * @param id - The workout ID
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

  /**
   * Partially update an existing workout
   * @param id - The workout ID to update
   * @param workout - The partial workout data to update
   */
  async patchWorkout(id: string, workout: Partial<UpdateWorkoutRequest>): Promise<Workout> {
    return hevyApiClient.patch<Workout>(`/workouts/${id}`, workout);
  }

  /**
   * Delete a workout
   * @param id - The workout ID to delete
   */
  async deleteWorkout(id: string): Promise<void> {
    return hevyApiClient.delete<void>(`/workouts/${id}`);
  }

  /**
   * Get workouts for a specific date range
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @param page - Optional page number
   * @param pageSize - Optional page size
   */
  async getWorkoutsByDateRange(
    startDate: string,
    endDate: string,
    page?: number,
    pageSize?: number
  ): Promise<HevyWorkoutsResponse> {
    return this.getWorkouts({
      startDate,
      endDate,
      page,
      pageSize,
    });
  }

  /**
   * Get all workouts for a specific date (helper method)
   * @param date - Date in YYYY-MM-DD format
   */
  async getWorkoutsByDate(date: string): Promise<HevyWorkoutsResponse> {
    const startDate = `${date}T00:00:00Z`;
    const endDate = `${date}T23:59:59Z`;
    
    return this.getWorkoutsByDateRange(startDate, endDate);
  }

  /**
   * Get recent workouts (helper method)
   * @param limit - Number of workouts to retrieve (default: 10)
   */
  async getRecentWorkouts(limit: number = 10): Promise<HevyWorkoutsResponse> {
    return this.getWorkouts({ page: 1, pageSize: limit });
  }
}

// Export singleton instance
export const workoutService = new WorkoutService();