/**
 * TypeScript types for Hevy API workout endpoints
 * Based on the /v1/workouts API response structure
 */

export interface HevyWorkoutsResponse {
  page: number;
  page_count: number;
  workouts: Workout[];
}

export interface Workout {
  id: string;
  title: string;
  description: string;
  start_time: string; // ISO date string
  end_time: string;   // ISO date string
  updated_at: string; // ISO date string
  created_at: string; // ISO date string
  exercises: Exercise[];
}

export interface Exercise {
  index: number;
  title: string;
  notes: string;
  exercise_template_id: string;
  superset_id: string | null;
  sets: Set[];
}

export interface Set {
  index: number;
  type: SetType;
  weight_kg: number;
  reps: number;
  distance_meters: number | null;
  duration_seconds: number | null;
  rpe: number | null; // Rate of Perceived Exertion (1-10 scale)
  custom_metric: number | null;
}

export type SetType = 'normal' | 'warmup' | 'failure' | 'drop' | string;

export interface WorkoutFilters {
  page?: number;
  pageSize?: number;
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
}

// Request types for creating/updating workouts
export interface CreateWorkoutRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  exercises: CreateExerciseRequest[];
}

export interface CreateExerciseRequest {
  index: number;
  title: string;
  notes?: string;
  exercise_template_id: string;
  superset_id?: string | null;
  sets: CreateSetRequest[];
}

export interface CreateSetRequest {
  index: number;
  type: SetType;
  weight_kg: number;
  reps: number;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  rpe?: number | null;
  custom_metric?: number | null;
}

export type UpdateWorkoutRequest = Partial<CreateWorkoutRequest>;

// API Error types
export interface HevyApiError {
  message: string;
  status: number;
  code?: string;
}