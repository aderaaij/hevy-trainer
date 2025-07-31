import { CreateRoutineRequest } from '@/lib/hevy/types/routines';

export interface AIGeneratedRoutine {
  title: string;
  notes: string;
  exercises: AIGeneratedExercise[];
}

export interface AIGeneratedExercise {
  exercise_template_id: string;
  title: string;
  superset_id: string | null;
  rest_seconds: number;
  notes: string | null;
  sets: AIGeneratedSet[];
}

export interface AIGeneratedSet {
  type: 'normal' | 'warmup' | 'failure' | 'drop';
  weight_kg: number | null;
  reps: number;
  rep_range: {
    start: number;
    end: number;
  };
}

export class RoutineTransformer {
  /**
   * Transform AI-generated routine to Hevy API format for creation
   */
  transformToHevyCreateRequest(aiRoutine: AIGeneratedRoutine): CreateRoutineRequest {
    return {
      routine: {
        title: aiRoutine.title,
        notes: aiRoutine.notes,
        exercises: aiRoutine.exercises.map((exercise) => ({
          exercise_template_id: exercise.exercise_template_id,
          superset_id: exercise.superset_id,
          rest_seconds: exercise.rest_seconds,
          notes: exercise.notes || '',
          sets: exercise.sets.map((set) => ({
            type: set.type,
            weight_kg: set.weight_kg || 0,
            reps: set.reps,
            distance_meters: null,
            duration_seconds: null,
            custom_metric: null,
            rep_range: set.rep_range
          }))
        }))
      }
    };
  }

  /**
   * Validate that AI-generated routine has valid exercise template IDs
   */
  validateExerciseIds(
    aiRoutine: AIGeneratedRoutine, 
    availableExerciseIds: string[]
  ): { valid: boolean; invalidIds: string[] } {
    const invalidIds: string[] = [];
    const exerciseIdSet = new Set(availableExerciseIds);

    for (const exercise of aiRoutine.exercises) {
      if (!exerciseIdSet.has(exercise.exercise_template_id)) {
        invalidIds.push(exercise.exercise_template_id);
      }
    }

    return {
      valid: invalidIds.length === 0,
      invalidIds
    };
  }

  /**
   * Enrich AI routine with additional metadata
   */
  enrichRoutineWithMetadata(
    aiRoutine: AIGeneratedRoutine,
    metadata: {
      weekNumber?: number;
      mesocycle?: string;
      focusArea?: string;
      targetMuscles?: string[];
    }
  ): AIGeneratedRoutine {
    const enrichedNotes = [
      aiRoutine.notes,
      metadata.weekNumber ? `Week ${metadata.weekNumber}` : '',
      metadata.mesocycle ? `Mesocycle: ${metadata.mesocycle}` : '',
      metadata.focusArea ? `Focus: ${metadata.focusArea}` : '',
      metadata.targetMuscles?.length ? `Targets: ${metadata.targetMuscles.join(', ')}` : ''
    ].filter(Boolean).join('\n');

    return {
      ...aiRoutine,
      notes: enrichedNotes
    };
  }

  /**
   * Split a multi-week program into individual routines
   */
  splitProgramIntoWeeks(
    program: AIGeneratedRoutine[],
    programName: string
  ): AIGeneratedRoutine[] {
    return program.map((routine, index) => ({
      ...routine,
      title: `${programName} - Week ${index + 1}: ${routine.title}`
    }));
  }

  /**
   * Apply progressive overload adjustments to a base routine
   */
  applyProgressiveOverload(
    baseRoutine: AIGeneratedRoutine,
    week: number,
    progressionType: 'linear' | 'undulating' | 'block' = 'linear'
  ): AIGeneratedRoutine {
    const adjustedExercises = baseRoutine.exercises.map(exercise => {
      const adjustedSets = exercise.sets.map(set => {
        if (set.type !== 'normal' || !set.weight_kg) return set;

        let weightMultiplier = 1;
        let repAdjustment = 0;

        switch (progressionType) {
          case 'linear':
            // Increase weight by 2.5% per week
            weightMultiplier = 1 + (week - 1) * 0.025;
            break;
          
          case 'undulating':
            // Vary intensity throughout the week
            if (week % 3 === 1) {
              weightMultiplier = 1.1; // Heavy
              repAdjustment = -2;
            } else if (week % 3 === 2) {
              weightMultiplier = 0.95; // Light
              repAdjustment = 2;
            } else {
              weightMultiplier = 1.05; // Medium
            }
            break;
          
          case 'block':
            // Different focus each block (4 weeks)
            const block = Math.floor((week - 1) / 4);
            if (block === 0) {
              // Hypertrophy block
              repAdjustment = 2;
              weightMultiplier = 0.95;
            } else if (block === 1) {
              // Strength block
              repAdjustment = -2;
              weightMultiplier = 1.1;
            } else {
              // Power block
              repAdjustment = -4;
              weightMultiplier = 1.15;
            }
            break;
        }

        return {
          ...set,
          weight_kg: Math.round(set.weight_kg * weightMultiplier * 2) / 2, // Round to nearest 0.5kg
          reps: Math.max(1, set.reps + repAdjustment),
          rep_range: {
            start: Math.max(1, set.rep_range.start + repAdjustment),
            end: Math.max(1, set.rep_range.end + repAdjustment)
          }
        };
      });

      return {
        ...exercise,
        sets: adjustedSets
      };
    });

    return {
      ...baseRoutine,
      title: `${baseRoutine.title} - Week ${week}`,
      exercises: adjustedExercises
    };
  }

  /**
   * Create a deload week routine from a regular routine
   */
  createDeloadRoutine(regularRoutine: AIGeneratedRoutine): AIGeneratedRoutine {
    const deloadExercises = regularRoutine.exercises.map(exercise => {
      const deloadSets = exercise.sets
        .filter(set => set.type === 'normal') // Keep only working sets
        .slice(0, Math.max(1, Math.floor(exercise.sets.length * 0.6))) // Reduce volume by 40%
        .map(set => ({
          ...set,
          weight_kg: set.weight_kg ? Math.round(set.weight_kg * 0.7 * 2) / 2 : null, // Reduce weight by 30%
          reps: Math.max(1, Math.floor(set.reps * 0.8)), // Reduce reps by 20%
          rep_range: {
            start: Math.max(1, Math.floor(set.rep_range.start * 0.8)),
            end: Math.max(1, Math.floor(set.rep_range.end * 0.8))
          }
        }));

      return {
        ...exercise,
        rest_seconds: Math.floor(exercise.rest_seconds * 1.5), // Increase rest by 50%
        sets: deloadSets,
        notes: exercise.notes ? `${exercise.notes}\nDeload week: Focus on form and recovery` : 'Deload week: Focus on form and recovery'
      };
    });

    return {
      ...regularRoutine,
      title: `${regularRoutine.title} - Deload Week`,
      notes: `${regularRoutine.notes}\n\nDELOAD WEEK: Reduced volume and intensity for recovery`,
      exercises: deloadExercises
    };
  }
}

export const routineTransformer = new RoutineTransformer();