/**
 * TypeScript types for Hevy API exercise template endpoints
 * Based on the /v1/exercise_templates API response structure
 */

export interface HevyExerciseTemplatesResponse {
  page: number;
  page_count: number;
  exercise_templates: ExerciseTemplate[];
}

export interface ExerciseTemplate {
  id: string;
  title: string;
  type: ExerciseType;
  primary_muscle_group: MuscleGroup;
  secondary_muscle_groups: MuscleGroup[];
  equipment: Equipment;
  is_custom: boolean;
}

export type ExerciseType = 
  | 'weight_reps'      // Weight and reps (e.g., bench press)
  | 'reps_only'        // Reps only (e.g., push-ups)
  | 'weight_distance'  // Weight and distance
  | 'distance_time'    // Distance and time (cardio)
  | 'time_only'        // Time only (planks, etc.)
  | 'weight_time'      // Weight and time
  | string;            // Allow for future types

export type MuscleGroup =
  | 'biceps'
  | 'triceps'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'abdominals'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'forearms'
  | 'traps'
  | 'lats'
  | 'delts'
  | 'obliques'
  | 'cardio'
  | string; // Allow for future muscle groups

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance_band'
  | 'none'
  | string; // Allow for future equipment types

export interface ExerciseTemplateFilters {
  page?: number;
  pageSize?: number;
}