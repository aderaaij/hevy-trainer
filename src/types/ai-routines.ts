/**
 * Centralized types for AI-generated routines
 */

// Core routine set structure
export interface RoutineSet {
  type: "normal" | "warmup" | "failure" | "drop";
  weight_kg: number | null;
  reps: number;
  rep_range: {
    start: number;
    end: number;
  };
}

// Core routine exercise structure
export interface RoutineExercise {
  exercise_template_id: string;
  title: string;
  superset_id: string | null;
  rest_seconds: number;
  notes: string | null;
  sets: RoutineSet[];
}

// Core routine structure (matches what RoutinePreview expects)
export interface Routine {
  title: string;
  notes: string;
  exercises: RoutineExercise[];
}

// Metadata about a generated routine
export interface RoutineMetadata {
  duration: number;
  workoutsPerWeek?: number;
  sessionDuration?: number;
  splitType?: string;
  progressionType: string;
  focusArea: string | null;
  exerciseCount?: number;
  routineCount?: number;
}

// Complete generated routine from the API
export interface GeneratedRoutine {
  id: string;
  routines: Routine[];
  reasoning: string;
  periodizationNotes: string;
  metadata: RoutineMetadata;
  createdAt: string;
  updatedAt?: string;
  exportedToHevy: boolean;
  hevyRoutineId: string | null;
}

// History view of a routine (what's shown in the list)
export interface RoutineHistoryItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  exportedToHevy: boolean;
  metadata: RoutineMetadata;
  firstRoutine: Routine;
}

// Exercise structure for history display (more flexible than RoutineExercise)
export interface HistoryRoutineExercise {
  id?: string;
  exercise_template_id: string;
  name?: string;
  title: string;
  sets: number;
  reps: string;
  weight?: string;
  restTime?: number;
  rest_seconds?: number;
  superset_id?: string | null;
  notes?: string;
}

// Routine structure for history display
export interface HistoryRoutine {
  title: string;
  notes: string;
  exercises: HistoryRoutineExercise[];
}