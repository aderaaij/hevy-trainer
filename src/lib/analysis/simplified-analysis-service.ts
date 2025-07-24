import { workoutService } from "@/lib/hevy";
import {
  simplifiedWorkoutAnalyzer,
  SimplifiedAnalysis,
} from "./simplified-workout-analyzer";
import { Workout } from "@/lib/hevy/types/workouts";

/**
 * Simplified service for workout analysis - acts as research assistant for LLM
 * Focuses on objective stats and pattern flagging, not recommendations
 */
export class SimplifiedAnalysisService {
  /**
   * Analyze user's complete workout history
   */
  async analyzeUserWorkouts(): Promise<SimplifiedAnalysis> {
    try {
      const workouts = await workoutService.getAllWorkouts();
      const analysis = await simplifiedWorkoutAnalyzer.analyzeWorkoutHistory(
        workouts
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
  async analyzeRecentTrends(): Promise<SimplifiedAnalysis> {
    try {
      const recentWorkouts: Workout[] = [];
      let page = 1;
      const pageSize = 10;

      // Fetch workouts from last 8 weeks
      while (recentWorkouts.length < 200 && page <= 10) {
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

      const analysis = await simplifiedWorkoutAnalyzer.analyzeWorkoutHistory(
        recentWorkouts
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
    startDate: Date,
    endDate: Date
  ): Promise<SimplifiedAnalysis> {
    try {
      const allWorkouts = await workoutService.getAllWorkouts();

      const periodWorkouts = allWorkouts.filter((workout) => {
        const workoutDate = new Date(workout.start_time);
        return workoutDate >= startDate && workoutDate <= endDate;
      });

      const analysis = await simplifiedWorkoutAnalyzer.analyzeWorkoutHistory(
        periodWorkouts
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
  async quickAnalysis(limit: number = 20): Promise<SimplifiedAnalysis> {
    try {
      const response = await workoutService.getRecentWorkouts(limit);
      const analysis = await simplifiedWorkoutAnalyzer.analyzeWorkoutHistory(
        response.workouts
      );
      return analysis;
    } catch (error) {
      console.error("Error performing quick analysis:", error);
      throw new Error("Failed to perform quick analysis");
    }
  }

  /**
   * Get raw workout data with basic stats - useful for LLM context
   */
  async getWorkoutSummary(limit?: number): Promise<{
    workouts: Workout[];
    summary: {
      count: number;
      dateRange: { start: string; end: string };
      totalExercises: number;
      avgDuration: number;
    };
  }> {
    try {
      const workouts = limit
        ? (await workoutService.getRecentWorkouts(limit)).workouts
        : await workoutService.getAllWorkouts();

      if (workouts.length === 0) {
        return {
          workouts: [],
          summary: {
            count: 0,
            dateRange: { start: "", end: "" },
            totalExercises: 0,
            avgDuration: 0,
          },
        };
      }

      const sortedWorkouts = workouts.sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

      const totalExercises = workouts.reduce(
        (sum, w) => sum + w.exercises.length,
        0
      );
      const totalDuration = workouts.reduce((sum, workout) => {
        const start = new Date(workout.start_time);
        const end = new Date(workout.end_time);
        return sum + (end.getTime() - start.getTime());
      }, 0);
      const avgDuration = totalDuration / workouts.length / (1000 * 60); // minutes

      return {
        workouts: sortedWorkouts,
        summary: {
          count: workouts.length,
          dateRange: {
            start: sortedWorkouts[0].start_time,
            end: sortedWorkouts[sortedWorkouts.length - 1].start_time,
          },
          totalExercises,
          avgDuration,
        },
      };
    } catch (error) {
      console.error("Error getting workout summary:", error);
      throw new Error("Failed to get workout summary");
    }
  }

  /**
   * Generate analysis context for LLM - combines stats with flags in readable format
   */
  async generateAnalysisContext(
    analysisType: "quick" | "recent" | "full" = "recent"
  ): Promise<{
    analysis: SimplifiedAnalysis;
    contextSummary: string;
  }> {
    try {
      let analysis: SimplifiedAnalysis;

      switch (analysisType) {
        case "quick":
          analysis = await this.quickAnalysis(10);
          break;
        case "recent":
          analysis = await this.analyzeRecentTrends();
          break;
        case "full":
          analysis = await this.analyzeUserWorkouts();
          break;
      }

      // Generate readable context summary for LLM
      const contextSummary = this.formatAnalysisForLLM(analysis);

      return { analysis, contextSummary };
    } catch (error) {
      console.error("Error generating analysis context:", error);
      throw new Error("Failed to generate analysis context");
    }
  }

  private formatAnalysisForLLM(analysis: SimplifiedAnalysis): string {
    const { stats, flags } = analysis;

    let context = `## Workout Data Summary\n\n`;

    // Basic stats
    context += `**Training Overview:**\n`;
    context += `- Total workouts: ${stats.totalWorkouts}\n`;
    context += `- Training period: ${stats.timeSpan.totalWeeks} weeks\n`;
    context += `- Average: ${stats.avgPerWeek.toFixed(1)} workouts/week\n`;
    context += `- Average workout: ${stats.avgWorkoutDuration.toFixed(
      0
    )} minutes, ${(stats.avgVolumePerWorkout / 1000).toFixed(
      1
    )}k kg volume\n\n`;

    // Exercise variety
    const uniqueExercises = Object.keys(stats.exerciseFrequency).length;
    context += `**Exercise Variety:**\n`;
    context += `- ${uniqueExercises} unique exercises\n`;
    context += `- Top exercises: ${Object.entries(stats.exerciseFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => `${name} (${count}x)`)
      .join(", ")}\n\n`;

    // Muscle group distribution
    context += `**Muscle Group Focus:**\n`;
    const sortedMuscles = Object.entries(stats.muscleGroupDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
    sortedMuscles.forEach(([muscle, count]) => {
      context += `- ${muscle}: ${count} exercises\n`;
    });
    context += `\n`;

    // Flags for attention
    if (flags.unusualPatterns.length > 0) {
      context += `**⚠️ Unusual Patterns (worth noting):**\n`;
      flags.unusualPatterns.forEach((pattern) => {
        context += `- ${pattern}\n`;
      });
      context += `\n`;
    }

    if (flags.potentialConcerns.length > 0) {
      context += `**🔍 Potential Areas of Interest:**\n`;
      flags.potentialConcerns.forEach((concern) => {
        context += `- ${concern}\n`;
      });
      context += `\n`;
    }

    if (flags.missingMuscleGroups.length > 0) {
      context += `**Missing/Underrepresented Muscle Groups:** ${flags.missingMuscleGroups.join(
        ", "
      )}\n\n`;
    }

    if (flags.consistencyIssues) {
      context += `**Consistency:** Some gaps detected in training schedule\n\n`;
    }

    context += `*This is objective data analysis. Use your expertise to interpret these patterns in context of the user's goals, experience, and preferences.*`;

    return context;
  }
}

// Export singleton instance
export const simplifiedAnalysisService = new SimplifiedAnalysisService();
