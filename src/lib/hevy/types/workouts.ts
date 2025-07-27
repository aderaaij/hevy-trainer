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
}

// Workout Events filters
export interface WorkoutEventsFilters {
  page?: number;
  pageSize?: number;
  since?: string; // ISO 8601 timestamp
}

// Workout count response
export interface WorkoutCountResponse {
  workout_count: number;
}

// Workout events response
export interface HevyWorkoutEventsResponse {
  page: number;
  page_count: number;
  workout_dates: string[]; // Array of date strings when workouts occurred
}

export interface WorkoutEvent {
  // Structure to be determined from actual API responses
  // The Postman collection doesn't include response examples
  id: string;
  type: string;
  created_at: string;
  // Additional fields may exist
}

// Request types for creating/updating workouts
export interface CreateWorkoutRequest {
  workout: {
    title: string;
    description?: string;
    start_time: string; // ISO 8601 timestamp
    end_time?: string; // ISO 8601 timestamp
    is_private?: boolean;
    exercises: CreateWorkoutExerciseRequest[];
  };
}

export interface CreateWorkoutExerciseRequest {
  exercise_template_id: string;
  superset_id?: string | null;
  notes?: string;
  sets: CreateWorkoutSetRequest[];
}

export interface CreateWorkoutSetRequest {
  type: SetType;
  weight_kg: number;
  reps: number;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  custom_metric?: unknown | null;
  rpe?: number | null;
}

export type UpdateWorkoutRequest = CreateWorkoutRequest;

// API Error types
export interface HevyApiError {
  message: string;
  status: number;
  code?: string;
}