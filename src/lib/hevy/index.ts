/**
 * Hevy API integration
 * Export all services and types for the Hevy API
 */

// Types
export * from './types/workouts';
export * from './types/exercise-templates';
export * from './types/routines';
export * from './types/routine-folders';

// Services
export { workoutService, WorkoutService } from './services/workouts';
export { exerciseTemplateService, ExerciseTemplateService } from './services/exercise-templates';
export { routineService, RoutineService } from './services/routines';
export { routineFolderService, RoutineFolderService } from './services/routine-folders';

// Client (if needed for advanced usage)
export { hevyApiClient, HevyApiClient } from './client';