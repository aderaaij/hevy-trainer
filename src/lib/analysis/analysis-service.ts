import { workoutService } from "@/lib/hevy";
import {
  workoutAnalyzer,
  WorkoutAnalysis,
  UserProfile,
} from "./workout-analyzer";
import { Workout } from "@/lib/hevy/types/workouts";

/**
 * Service layer for workout analysis operations
 * Integrates with existing Hevy workout service and analyzer
 */
export class AnalysisService {
  /**
   * Analyze user's complete workout history
   */
  async analyzeUserWorkouts(
    userProfile: UserProfile
  ): Promise<WorkoutAnalysis> {
    try {
      // Fetch all user workouts
      const workouts = await workoutService.getAllWorkouts();

      // Perform analysis
      const analysis = await workoutAnalyzer.analyzeWorkoutHistory(
        workouts,
        userProfile
      );

      return analysis;
    } catch (error) {
      console.error("Error analyzing user workouts:", error);
      throw new Error("Failed to analyze workout history");
    }
  }

  /**
   * Analyze recent workout trends (last 8 weeks)
   */
  async analyzeRecentTrends(
    userProfile: UserProfile
  ): Promise<WorkoutAnalysis> {
    try {
      // Fetch recent workouts with pagination
      const recentWorkouts: Workout[] = [];
      let page = 1;
      const pageSize = 10;

      // Fetch workouts from last 8 weeks (approximate)
      while (recentWorkouts.length < 200 && page <= 10) {
        // Safety limit
        const response = await workoutService.getWorkoutsPage(page, pageSize);

        if (response.workouts.length === 0) break;

        // Filter workouts from last 8 weeks
        const eightWeeksAgo = new Date();
        eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

        const filteredWorkouts = response.workouts.filter(
          (workout) => new Date(workout.start_time) >= eightWeeksAgo
        );

        recentWorkouts.push(...filteredWorkouts);

        // If we've gone past 8 weeks, stop fetching
        if (
          response.workouts.some((w) => new Date(w.start_time) < eightWeeksAgo)
        ) {
          break;
        }

        page++;
      }

      // Perform analysis on recent data
      const analysis = await workoutAnalyzer.analyzeWorkoutHistory(
        recentWorkouts,
        userProfile
      );

      return analysis;
    } catch (error) {
      console.error("Error analyzing recent workout trends:", error);
      throw new Error("Failed to analyze recent workout trends");
    }
  }

  /**
   * Analyze specific workout period
   */
  async analyzeWorkoutPeriod(
    userProfile: UserProfile,
    startDate: Date,
    endDate: Date
  ): Promise<WorkoutAnalysis> {
    try {
      // Fetch all workouts and filter by date range
      const allWorkouts = await workoutService.getAllWorkouts();

      const periodWorkouts = allWorkouts.filter((workout) => {
        const workoutDate = new Date(workout.start_time);
        return workoutDate >= startDate && workoutDate <= endDate;
      });

      // Perform analysis on period data
      const analysis = await workoutAnalyzer.analyzeWorkoutHistory(
        periodWorkouts,
        userProfile
      );

      return analysis;
    } catch (error) {
      console.error("Error analyzing workout period:", error);
      throw new Error("Failed to analyze workout period");
    }
  }

  /**
   * Quick analysis using limited recent workouts
   */
  async quickAnalysis(
    userProfile: UserProfile,
    limit: number = 20
  ): Promise<WorkoutAnalysis> {
    try {
      const response = await workoutService.getRecentWorkouts(limit);
      const analysis = await workoutAnalyzer.analyzeWorkoutHistory(
        response.workouts,
        userProfile
      );

      return analysis;
    } catch (error) {
      console.error("Error performing quick analysis:", error);
      throw new Error("Failed to perform quick analysis");
    }
  }

  /**
   * Get workout volume trends over time
   */
  async getVolumeTrends(weeks: number = 12): Promise<{
    weeklyVolumes: number[];
    weekLabels: string[];
    trend: "increasing" | "decreasing" | "stable" | "erratic";
  }> {
    try {
      // Fetch recent workouts
      const weeksAgo = new Date();
      weeksAgo.setDate(weeksAgo.getDate() - weeks * 7);

      const allWorkouts = await workoutService.getAllWorkouts();
      const periodWorkouts = allWorkouts.filter(
        (workout) => new Date(workout.start_time) >= weeksAgo
      );

      // Group by week and calculate volumes
      const weeklyData = this.groupWorkoutsByWeek(periodWorkouts);
      const weeklyVolumes = Object.values(weeklyData).map((weekWorkouts) =>
        weekWorkouts.reduce(
          (sum, workout) => sum + this.calculateWorkoutVolume(workout),
          0
        )
      );

      const weekLabels = Object.keys(weeklyData);

      // Calculate trend
      const trend = this.calculateTrend(weeklyVolumes);

      return {
        weeklyVolumes,
        weekLabels,
        trend,
      };
    } catch (error) {
      console.error("Error getting volume trends:", error);
      throw new Error("Failed to get volume trends");
    }
  }

  /**
   * Get exercise frequency analysis
   */
  async getExerciseFrequency(weeks: number = 8): Promise<{
    exerciseFrequency: Record<string, number>;
    muscleGroupFrequency: Record<string, number>;
    movementPatterns: Record<string, number>;
  }> {
    try {
      const weeksAgo = new Date();
      weeksAgo.setDate(weeksAgo.getDate() - weeks * 7);

      const allWorkouts = await workoutService.getAllWorkouts();
      const periodWorkouts = allWorkouts.filter(
        (workout) => new Date(workout.start_time) >= weeksAgo
      );

      const exerciseFrequency: Record<string, number> = {};
      const muscleGroupFrequency: Record<string, number> = {};
      const movementPatterns: Record<string, number> = {};

      periodWorkouts.forEach((workout) => {
        workout.exercises.forEach((exercise) => {
          // Count exercise frequency
          exerciseFrequency[exercise.title] =
            (exerciseFrequency[exercise.title] || 0) + 1;

          // Count muscle groups (simplified categorization)
          const muscleGroups = this.categorizeToMuscleGroups(exercise.title);
          muscleGroups.forEach((group) => {
            muscleGroupFrequency[group] =
              (muscleGroupFrequency[group] || 0) + 1;
          });

          // Count movement patterns
          const pattern = this.categorizeMovementPattern(exercise.title);
          if (pattern) {
            movementPatterns[pattern] = (movementPatterns[pattern] || 0) + 1;
          }
        });
      });

      return {
        exerciseFrequency,
        muscleGroupFrequency,
        movementPatterns,
      };
    } catch (error) {
      console.error("Error getting exercise frequency:", error);
      throw new Error("Failed to get exercise frequency");
    }
  }

  // Helper methods
  private groupWorkoutsByWeek(workouts: Workout[]): Record<string, Workout[]> {
    const weeklyWorkouts: Record<string, Workout[]> = {};

    workouts.forEach((workout) => {
      const date = new Date(workout.start_time);
      const yearWeek = this.getYearWeek(date);

      if (!weeklyWorkouts[yearWeek]) {
        weeklyWorkouts[yearWeek] = [];
      }
      weeklyWorkouts[yearWeek].push(workout);
    });

    return weeklyWorkouts;
  }

  private getYearWeek(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor(
      (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${week.toString().padStart(2, "0")}`;
  }

  private calculateWorkoutVolume(workout: Workout): number {
    return workout.exercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.sets.reduce((sum, set) => {
        return sum + set.weight_kg * set.reps;
      }, 0);
      return total + exerciseVolume;
    }, 0);
  }

  private calculateTrend(
    values: number[]
  ): "increasing" | "decreasing" | "stable" | "erratic" {
    if (values.length < 3) return "stable";

    // Simple trend calculation
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(changePercent) < 5) return "stable";
    if (changePercent > 5) return "increasing";
    if (changePercent < -5) return "decreasing";
    return "erratic";
  }

  private categorizeToMuscleGroups(exerciseName: string): string[] {
    const muscleGroups: string[] = [];
    const lower = exerciseName.toLowerCase();

    const muscleMap = {
      chest: ["chest", "bench", "press", "fly", "pec"],
      back: ["row", "pull", "lat", "back", "deadlift"],
      shoulders: ["shoulder", "overhead", "military", "lateral", "rear delt"],
      biceps: ["bicep", "curl", "hammer", "preacher"],
      triceps: ["tricep", "dip", "close grip", "overhead"],
      quadriceps: ["squat", "quad", "leg press", "lunge", "extension"],
      hamstrings: ["hamstring", "deadlift", "curl", "romanian"],
      glutes: ["glute", "hip thrust", "bridge", "deadlift"],
      calves: ["calf", "raise"],
      core: ["abs", "core", "plank", "crunch", "oblique"],
    };

    Object.entries(muscleMap).forEach(([muscle, keywords]) => {
      if (keywords.some((keyword) => lower.includes(keyword))) {
        muscleGroups.push(muscle);
      }
    });

    return muscleGroups.length > 0 ? muscleGroups : ["unknown"];
  }

  private categorizeMovementPattern(exerciseName: string): string | null {
    const patterns = {
      push: [
        "press",
        "push",
        "dip",
        "fly",
        "chest",
        "bench",
        "shoulder",
        "overhead",
        "tricep",
        "military",
        "incline",
        "decline",
        "pushup",
      ],
      pull: [
        "row",
        "pull",
        "curl",
        "pulldown",
        "pullup",
        "chinup",
        "lat",
        "back",
        "bicep",
        "hammer",
        "preacher",
        "cable",
        "machine",
        "barbell curl",
      ],
      legs: [
        "squat",
        "lunge",
        "deadlift",
        "leg",
        "calf",
        "quad",
        "hamstring",
        "glute",
        "hip",
        "thigh",
        "step",
        "split",
        "bulgarian",
      ],
      core: [
        "plank",
        "crunch",
        "abs",
        "core",
        "oblique",
        "russian",
        "mountain",
        "hanging",
        "knee",
        "sit",
        "twist",
      ],
    };

    const lower = exerciseName.toLowerCase();
    for (const [pattern, keywords] of Object.entries(patterns)) {
      if (keywords.some((keyword) => lower.includes(keyword))) {
        return pattern;
      }
    }

    return null;
  }
}

// Export singleton instance
export const analysisService = new AnalysisService();
