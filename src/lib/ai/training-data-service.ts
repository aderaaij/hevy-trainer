import {
  PrismaClient,
  ImportedWorkout,
  ImportedExerciseTemplate,
} from "@/generated/prisma";

const prisma = new PrismaClient();

export interface WorkoutSummary {
  name: string;
  date: Date;
  exercises: ExerciseSummary[];
  totalVolume: number;
  muscleGroups: string[];
}

export interface ExerciseSummary {
  name: string;
  sets: number;
  totalVolume: number;
  maxWeight: number;
  avgReps: number;
  muscleGroup: string;
}

export interface TrainingContext {
  profile: {
    age: number | null;
    weight: number | null;
    experienceLevel: string | null;
    trainingFrequency: number | null;
    focusAreas: string[];
    injuries: string[];
    injuryDetails: string | null;
    otherActivities: string | null;
  };
  trainingHistory: {
    recentWorkouts: WorkoutSummary[];
    weeklyVolume: number[];
    frequencyPattern: Record<string, number>;
    muscleGroupFrequency: Record<string, number>;
    progressionTrends: {
      volumeTrend: "increasing" | "decreasing" | "stable";
      intensityTrend: "increasing" | "decreasing" | "stable";
    };
  };
  availableExercises: {
    byMuscleGroup: Record<string, ExerciseOption[]>;
    byEquipment: Record<string, ExerciseOption[]>;
    total: number;
  };
}

export interface ExerciseOption {
  id: string;
  title: string;
  type: string;
  primaryMuscle: string;
  equipment: string;
  isCustom: boolean;
}

export class TrainingDataService {
  async gatherTrainingContext(userId: string): Promise<TrainingContext> {
    // Fetch user profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Fetch workout history (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const workouts = await prisma.importedWorkout.findMany({
      where: {
        userId,
        performedAt: {
          gte: eightWeeksAgo,
        },
      },
      orderBy: {
        performedAt: "desc",
      },
    });

    // Fetch available exercises
    const exercises = await prisma.importedExerciseTemplate.findMany({
      where: { userId },
    });

    // Process workout data
    const workoutSummaries = this.processWorkouts(workouts, exercises);
    const weeklyVolume = this.calculateWeeklyVolume(workoutSummaries);
    const frequencyPattern = this.analyzeFrequencyPattern(workoutSummaries);
    const muscleGroupFrequency =
      this.analyzeMuscleGroupFrequency(workoutSummaries);
    const progressionTrends = this.analyzeProgressionTrends(workoutSummaries);

    // Process available exercises
    const exerciseOptions = this.processExercises(exercises);

    return {
      profile: {
        age: profile.age,
        weight: profile.weight,
        experienceLevel: profile.experienceLevel,
        trainingFrequency: profile.trainingFrequency,
        focusAreas: profile.focusAreas,
        injuries: profile.injuries,
        injuryDetails: profile.injuryDetails,
        otherActivities: profile.otherActivities,
      },
      trainingHistory: {
        recentWorkouts: workoutSummaries.slice(0, 10), // Last 10 workouts
        weeklyVolume,
        frequencyPattern,
        muscleGroupFrequency,
        progressionTrends,
      },
      availableExercises: exerciseOptions,
    };
  }

  private processWorkouts(
    workouts: ImportedWorkout[],
    exercises: ImportedExerciseTemplate[]
  ): WorkoutSummary[] {
    const exerciseMap = new Map(
      exercises
        .filter((e) => e.exerciseTemplateData) // Only include exercises with valid template data
        .map((e) => [
          e.hevyExerciseId,
          e.exerciseTemplateData as {
            title?: string;
            primary_muscle_group?: string;
            equipment?: string;
            modality?: string;
            secondary_muscle_groups?: string[];
          },
        ])
    );

    return workouts.map((workout) => {
      const workoutData = workout.workoutData as {
        exercises?: Array<{
          exercise_template_id: string;
          sets: Array<{
            type: string;
            weight_kg?: number;
            reps?: number;
          }>;
        }>;
      };
      const exerciseSummaries: ExerciseSummary[] = [];
      let totalVolume = 0;
      const muscleGroups = new Set<string>();

      if (workoutData.exercises) {
        for (const exercise of workoutData.exercises) {
          const template = exerciseMap.get(exercise.exercise_template_id);
          if (!template || !template.title || !template.primary_muscle_group)
            continue;

          let exerciseVolume = 0;
          let maxWeight = 0;
          let totalReps = 0;
          let setCount = 0;

          for (const set of exercise.sets) {
            if (set.type === "normal" && set.weight_kg && set.reps) {
              exerciseVolume += set.weight_kg * set.reps;
              maxWeight = Math.max(maxWeight, set.weight_kg);
              totalReps += set.reps;
              setCount++;
            }
          }

          if (setCount > 0) {
            exerciseSummaries.push({
              name: template.title,
              sets: setCount,
              totalVolume: exerciseVolume,
              maxWeight,
              avgReps: totalReps / setCount,
              muscleGroup: template.primary_muscle_group,
            });

            totalVolume += exerciseVolume;
            muscleGroups.add(template.primary_muscle_group);
          }
        }
      }

      return {
        name: workout.name || "Workout",
        date: workout.performedAt,
        exercises: exerciseSummaries,
        totalVolume,
        muscleGroups: Array.from(muscleGroups),
      };
    });
  }

  private calculateWeeklyVolume(workouts: WorkoutSummary[]): number[] {
    const weeklyVolumes: Map<number, number> = new Map();
    const now = new Date();

    for (const workout of workouts) {
      const weeksAgo = Math.floor(
        (now.getTime() - workout.date.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const currentVolume = weeklyVolumes.get(weeksAgo) || 0;
      weeklyVolumes.set(weeksAgo, currentVolume + workout.totalVolume);
    }

    // Return last 8 weeks of volume
    const volumes: number[] = [];
    for (let i = 7; i >= 0; i--) {
      volumes.push(weeklyVolumes.get(i) || 0);
    }

    return volumes;
  }

  private analyzeFrequencyPattern(
    workouts: WorkoutSummary[]
  ): Record<string, number> {
    const dayFrequency: Record<string, number> = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    };

    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    for (const workout of workouts) {
      const day = days[workout.date.getDay()];
      dayFrequency[day]++;
    }

    return dayFrequency;
  }

  private analyzeMuscleGroupFrequency(
    workouts: WorkoutSummary[]
  ): Record<string, number> {
    const frequency: Record<string, number> = {};

    for (const workout of workouts) {
      for (const muscleGroup of workout.muscleGroups) {
        frequency[muscleGroup] = (frequency[muscleGroup] || 0) + 1;
      }
    }

    return frequency;
  }

  private analyzeProgressionTrends(workouts: WorkoutSummary[]): {
    volumeTrend: "increasing" | "decreasing" | "stable";
    intensityTrend: "increasing" | "decreasing" | "stable";
  } {
    if (workouts.length < 4) {
      return { volumeTrend: "stable", intensityTrend: "stable" };
    }

    // Compare recent vs older workouts
    const recentWorkouts = workouts.slice(0, Math.floor(workouts.length / 2));
    const olderWorkouts = workouts.slice(Math.floor(workouts.length / 2));

    const recentAvgVolume =
      recentWorkouts.reduce((sum, w) => sum + w.totalVolume, 0) /
      recentWorkouts.length;
    const olderAvgVolume =
      olderWorkouts.reduce((sum, w) => sum + w.totalVolume, 0) /
      olderWorkouts.length;

    const volumeChange = (recentAvgVolume - olderAvgVolume) / olderAvgVolume;

    // Calculate intensity (average max weight across exercises)
    const getAvgMaxWeight = (workouts: WorkoutSummary[]) => {
      let totalMaxWeight = 0;
      let exerciseCount = 0;

      for (const workout of workouts) {
        for (const exercise of workout.exercises) {
          if (exercise.maxWeight > 0) {
            totalMaxWeight += exercise.maxWeight;
            exerciseCount++;
          }
        }
      }

      return exerciseCount > 0 ? totalMaxWeight / exerciseCount : 0;
    };

    const recentAvgIntensity = getAvgMaxWeight(recentWorkouts);
    const olderAvgIntensity = getAvgMaxWeight(olderWorkouts);
    const intensityChange =
      olderAvgIntensity > 0
        ? (recentAvgIntensity - olderAvgIntensity) / olderAvgIntensity
        : 0;

    return {
      volumeTrend:
        volumeChange > 0.1
          ? "increasing"
          : volumeChange < -0.1
          ? "decreasing"
          : "stable",
      intensityTrend:
        intensityChange > 0.05
          ? "increasing"
          : intensityChange < -0.05
          ? "decreasing"
          : "stable",
    };
  }

  private processExercises(exercises: ImportedExerciseTemplate[]): {
    byMuscleGroup: Record<string, ExerciseOption[]>;
    byEquipment: Record<string, ExerciseOption[]>;
    total: number;
  } {
    const byMuscleGroup: Record<string, ExerciseOption[]> = {};
    const byEquipment: Record<string, ExerciseOption[]> = {};

    for (const exercise of exercises) {
      const data = exercise.exerciseTemplateData as {
        id?: string;
        title?: string;
        primary_muscle_group?: string;
        equipment?: string;
        modality?: string;
        secondary_muscle_groups?: string[];
      };

      // Skip exercises with invalid or missing data
      if (
        !data ||
        !data.title ||
        !data.primary_muscle_group ||
        !data.equipment
      ) {
        console.warn(
          `Skipping exercise with invalid data:`,
          exercise.hevyExerciseId
        );
        continue;
      }

      const option: ExerciseOption = {
        id: exercise.hevyExerciseId,
        title: data.title,
        type: data.modality || "unknown",
        primaryMuscle: data.primary_muscle_group,
        equipment: data.equipment,
        isCustom: exercise.isCustom,
      };

      // Group by muscle
      if (!byMuscleGroup[data.primary_muscle_group]) {
        byMuscleGroup[data.primary_muscle_group] = [];
      }
      byMuscleGroup[data.primary_muscle_group].push(option);

      // Group by equipment
      if (!byEquipment[data.equipment]) {
        byEquipment[data.equipment] = [];
      }
      byEquipment[data.equipment].push(option);
    }

    return {
      byMuscleGroup,
      byEquipment,
      total: exercises.length,
    };
  }
}

export const trainingDataService = new TrainingDataService();
