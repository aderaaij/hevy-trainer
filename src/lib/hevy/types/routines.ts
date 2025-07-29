/**
 * TypeScript types for Hevy API routine endpoints
 * Based on Postman collection analysis
 */

export interface HevyRoutinesResponse {
  page: number;
  page_count: number;
  routines: Routine[];
}

export interface Routine {
  id: string | number; // Can be string or number from API
  title: string;
  folder_id: string | number | null; // Can be string or number from API
  notes: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  exercises: RoutineExercise[];
}

export interface RoutineExercise {
  index: number;
  title: string;
  exercise_template_id: string;
  superset_id: string | null;
  rest_seconds: number;
  notes: string | null;
  sets: RoutineSet[];
}

export interface RoutineSet {
  index: number;
  type: RoutineSetType;
  weight_kg: number | null;
  reps: number;
  distance_meters: number | null;
  duration_seconds: number | null;
  custom_metric: unknown | null;
  rep_range?: RepRange; // Optional since it's not always present in actual API responses
}

export interface RepRange {
  start: number;
  end: number;
}

export type RoutineSetType = 'normal' | 'warmup' | 'failure' | 'drop' | string;

export interface RoutineFilters {
  page?: number;
  pageSize?: number;
}

// Request types for creating/updating routines
export interface CreateRoutineRequest {
  routine: {
    title: string;
    folder_id?: string | null;
    notes?: string;
    exercises: CreateRoutineExerciseRequest[];
  };
}

export interface CreateRoutineExerciseRequest {
  exercise_template_id: string;
  superset_id?: string | null;
  rest_seconds: number;
  notes?: string;
  sets: CreateRoutineSetRequest[];
}

export interface CreateRoutineSetRequest {
  type: RoutineSetType;
  weight_kg: number;
  reps: number;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  custom_metric?: unknown | null;
  rep_range: RepRange;
}

// Update request (excludes folder_id as it's not updatable according to Postman examples)
export interface UpdateRoutineRequest {
  routine: {
    title: string;
    notes?: string;
    exercises: CreateRoutineExerciseRequest[];
  };
}