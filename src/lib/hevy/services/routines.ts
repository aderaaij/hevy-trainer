import { hevyApiClient } from '../client';
import {
  HevyRoutinesResponse,
  Routine,
  RoutineFilters,
  CreateRoutineRequest,
  UpdateRoutineRequest,
} from '../types/routines';

/**
 * Complete service for Hevy API routine endpoints
 * Based on Postman collection analysis - all endpoints confirmed
 */
export class RoutineService {
  /**
   * Get a paginated list of routines
   * @param filters - Optional pagination filters
   */
  async getRoutines(filters?: RoutineFilters): Promise<HevyRoutinesResponse> {
    const params = new URLSearchParams();
    
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/routines?${queryString}` : '/routines';
    
    return hevyApiClient.get<HevyRoutinesResponse>(url);
  }

  /**
   * Get a single routine by ID
   * @param id - The routine ID (UUID)
   */
  async getRoutine(id: string): Promise<Routine> {
    const response = await hevyApiClient.get<{ routine: Routine }>(`/routines/${id}`);
    return response.routine;
  }

  /**
   * Create a new routine
   * @param routine - The routine data to create
   */
  async createRoutine(routine: CreateRoutineRequest): Promise<Routine> {
    return hevyApiClient.post<Routine>('/routines', routine);
  }

  /**
   * Update an existing routine
   * @param id - The routine ID to update
   * @param routine - The routine data to update
   */
  async updateRoutine(id: string, routine: UpdateRoutineRequest): Promise<Routine> {
    return hevyApiClient.put<Routine>(`/routines/${id}`, routine);
  }

  // Helper methods

  /**
   * Get recent routines (helper method)
   * @param limit - Number of routines to retrieve (default: 10)
   */
  async getRecentRoutines(limit: number = 10): Promise<HevyRoutinesResponse> {
    return this.getRoutines({ page: 1, pageSize: limit });
  }

  /**
   * Get a specific page of routines
   * @param page - Page number
   * @param pageSize - Number of items per page
   */
  async getRoutinesPage(page: number = 1, pageSize: number = 10): Promise<HevyRoutinesResponse> {
    return this.getRoutines({ page, pageSize });
  }

  /**
   * Get all routines (helper method that fetches all pages)
   * WARNING: This may take a while if there are many routines
   * Use with caution!
   */
  async getAllRoutines(): Promise<Routine[]> {
    const allRoutines: Routine[] = [];
    let currentPage = 1;
    let totalPages = 1;
    
    do {
      const response = await this.getRoutines({
        page: currentPage,
        pageSize: 100, // Maximum to reduce requests
      });
      
      allRoutines.push(...response.routines);
      totalPages = response.page_count;
      currentPage++;
    } while (currentPage <= totalPages);
    
    return allRoutines;
  }

  /**
   * Create a simple routine with basic structure
   * Helper method for easier routine creation
   * @param title - Routine title
   * @param exercises - Array of exercise template IDs with basic set configuration
   * @param options - Optional configuration
   */
  async createSimpleRoutine(
    title: string,
    exercises: Array<{
      exercise_template_id: string;
      weight_kg: number;
      reps: number;
      sets: number;
      rest_seconds?: number;
      notes?: string;
    }>,
    options?: {
      folder_id?: string | null;
      notes?: string;
    }
  ): Promise<Routine> {
    const routineExercises = exercises.map((exercise) => ({
      exercise_template_id: exercise.exercise_template_id,
      superset_id: null,
      rest_seconds: exercise.rest_seconds || 90,
      notes: exercise.notes || '',
      sets: Array.from({ length: exercise.sets }, () => ({
        type: 'normal' as const,
        weight_kg: exercise.weight_kg,
        reps: exercise.reps,
        distance_meters: null,
        duration_seconds: null,
        custom_metric: null,
        rep_range: {
          start: Math.max(1, exercise.reps - 2),
          end: exercise.reps + 2,
        },
      })),
    }));

    return this.createRoutine({
      routine: {
        title,
        folder_id: options?.folder_id || null,
        notes: options?.notes || '',
        exercises: routineExercises,
      },
    });
  }
}

// Export singleton instance
export const routineService = new RoutineService();