import { Workout } from '@/lib/hevy/types/workouts';

export interface SimplifiedAnalysis {
  // Just the facts, no recommendations
  stats: {
    totalWorkouts: number;
    timeSpan: {
      firstWorkout: string;
      lastWorkout: string;
      totalWeeks: number;
    };
    avgPerWeek: number;
    volumeByWeek: number[];
    weekLabels: string[];
    exerciseFrequency: Record<string, number>;
    muscleGroupDistribution: Record<string, number>;
    avgWorkoutDuration: number; // minutes
    totalVolume: number;
    avgVolumePerWorkout: number;
  };
  
  // Flags for LLM attention
  flags: {
    unusualPatterns: string[]; // "Volume doubled this week"
    missingMuscleGroups: string[];
    consistencyIssues: boolean;
    potentialConcerns: string[];
  };
}

export interface UserProfile {
  age: number;
  weight: number;
  injuries: string[];
  goals: string[];
  experience: string;
}

export class SimplifiedWorkoutAnalyzer {
  /**
   * Analyze workout history and provide objective stats + flags for LLM
   */
  async analyzeWorkoutHistory(workouts: Workout[]): Promise<SimplifiedAnalysis> {
    if (workouts.length === 0) {
      return this.getEmptyAnalysis();
    }

    // Sort workouts by date
    const sortedWorkouts = this.sortWorkoutsByDate(workouts);
    
    // Calculate basic statistics
    const stats = this.calculateBasicStats(sortedWorkouts);
    
    // Generate flags for LLM attention
    const flags = this.generateFlags(sortedWorkouts, stats);

    return { stats, flags };
  }

  private getEmptyAnalysis(): SimplifiedAnalysis {
    return {
      stats: {
        totalWorkouts: 0,
        timeSpan: {
          firstWorkout: '',
          lastWorkout: '',
          totalWeeks: 0,
        },
        avgPerWeek: 0,
        volumeByWeek: [],
        weekLabels: [],
        exerciseFrequency: {},
        muscleGroupDistribution: {},
        avgWorkoutDuration: 0,
        totalVolume: 0,
        avgVolumePerWorkout: 0,
      },
      flags: {
        unusualPatterns: ['No workout data available'],
        missingMuscleGroups: [],
        consistencyIssues: true,
        potentialConcerns: ['No workout history to analyze'],
      },
    };
  }

  private calculateBasicStats(workouts: Workout[]) {
    const totalWorkouts = workouts.length;
    
    // Time span calculation
    const firstWorkout = workouts[0].start_time;
    const lastWorkout = workouts[workouts.length - 1].start_time;
    const totalWeeks = this.getWeeksDifference(new Date(firstWorkout), new Date(lastWorkout));
    const avgPerWeek = totalWorkouts / Math.max(totalWeeks, 1);

    // Volume by week
    const weeklyData = this.groupWorkoutsByWeek(workouts);
    const volumeByWeek = Object.values(weeklyData).map(weekWorkouts => 
      weekWorkouts.reduce((sum, workout) => sum + this.calculateWorkoutVolume(workout), 0)
    );
    const weekLabels = Object.keys(weeklyData);

    // Exercise frequency
    const exerciseFrequency: Record<string, number> = {};
    const muscleGroupDistribution: Record<string, number> = {};

    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        // Count exercise frequency
        exerciseFrequency[exercise.title] = (exerciseFrequency[exercise.title] || 0) + 1;
        
        // Count muscle groups
        const muscleGroups = this.categorizeToMuscleGroups(exercise.title);
        muscleGroups.forEach(group => {
          muscleGroupDistribution[group] = (muscleGroupDistribution[group] || 0) + 1;
        });
      });
    });

    // Duration calculation
    const totalDuration = workouts.reduce((sum, workout) => {
      const start = new Date(workout.start_time);
      const end = new Date(workout.end_time);
      return sum + (end.getTime() - start.getTime());
    }, 0);
    const avgWorkoutDuration = totalDuration / workouts.length / (1000 * 60); // Convert to minutes

    // Volume calculations
    const totalVolume = workouts.reduce((sum, workout) => sum + this.calculateWorkoutVolume(workout), 0);
    const avgVolumePerWorkout = totalVolume / workouts.length;

    return {
      totalWorkouts,
      timeSpan: {
        firstWorkout,
        lastWorkout,
        totalWeeks,
      },
      avgPerWeek,
      volumeByWeek,
      weekLabels,
      exerciseFrequency,
      muscleGroupDistribution,
      avgWorkoutDuration,
      totalVolume,
      avgVolumePerWorkout,
    };
  }

  private generateFlags(workouts: Workout[], stats: SimplifiedAnalysis['stats']) {
    const unusualPatterns: string[] = [];
    const potentialConcerns: string[] = [];

    // Check for unusual volume patterns
    if (stats.volumeByWeek.length >= 2) {
      const recent = stats.volumeByWeek.slice(-2);
      const changePercent = ((recent[1] - recent[0]) / recent[0]) * 100;
      
      if (changePercent > 50) {
        unusualPatterns.push(`Volume increased by ${Math.round(changePercent)}% in latest week`);
      } else if (changePercent < -50) {
        unusualPatterns.push(`Volume decreased by ${Math.abs(Math.round(changePercent))}% in latest week`);
      }

      // Check for erratic volume
      const volumeVariation = this.calculateVariationCoefficient(stats.volumeByWeek);
      if (volumeVariation > 0.5) {
        unusualPatterns.push('Highly variable training volume week-to-week');
      }
    }

    // Check workout frequency patterns
    if (stats.avgPerWeek > 7) {
      potentialConcerns.push('Training more than once per day on average');
    } else if (stats.avgPerWeek < 1) {
      potentialConcerns.push('Training less than once per week on average');
    }

    // Check for exercise variety
    const uniqueExercises = Object.keys(stats.exerciseFrequency).length;
    if (uniqueExercises < 5 && stats.totalWorkouts > 10) {
      potentialConcerns.push(`Limited exercise variety: only ${uniqueExercises} unique exercises`);
    }

    // Check for extremely long or short workouts
    if (stats.avgWorkoutDuration > 180) {
      unusualPatterns.push(`Very long workouts: ${Math.round(stats.avgWorkoutDuration)} minutes average`);
    } else if (stats.avgWorkoutDuration < 20 && stats.totalWorkouts > 5) {
      unusualPatterns.push(`Very short workouts: ${Math.round(stats.avgWorkoutDuration)} minutes average`);
    }

    // Identify missing muscle groups
    const expectedMuscleGroups = ['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'core'];
    const missingMuscleGroups = expectedMuscleGroups.filter(group => 
      !stats.muscleGroupDistribution[group] || stats.muscleGroupDistribution[group] < 2
    );

    // Check consistency - simple version
    const consistencyIssues = this.hasConsistencyIssues(workouts);

    return {
      unusualPatterns,
      missingMuscleGroups,
      consistencyIssues,
      potentialConcerns,
    };
  }

  private hasConsistencyIssues(workouts: Workout[]): boolean {
    if (workouts.length < 4) return true;

    // Check for large gaps between workouts
    const sortedWorkouts = this.sortWorkoutsByDate(workouts);
    let hasLargeGaps = false;

    for (let i = 1; i < sortedWorkouts.length; i++) {
      const prev = new Date(sortedWorkouts[i - 1].start_time);
      const current = new Date(sortedWorkouts[i].start_time);
      const daysDiff = (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 14) { // More than 2 weeks gap
        hasLargeGaps = true;
        break;
      }
    }

    return hasLargeGaps;
  }

  private calculateVariationCoefficient(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? stdDev / mean : 0;
  }

  // Helper methods (kept from original but simplified)
  private sortWorkoutsByDate(workouts: Workout[]): Workout[] {
    return [...workouts].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }

  private getWeeksDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }

  private calculateWorkoutVolume(workout: Workout): number {
    return workout.exercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.sets.reduce((sum, set) => {
        return sum + (set.weight_kg * set.reps);
      }, 0);
      return total + exerciseVolume;
    }, 0);
  }

  private groupWorkoutsByWeek(workouts: Workout[]): Record<string, Workout[]> {
    const weeklyWorkouts: Record<string, Workout[]> = {};

    workouts.forEach(workout => {
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
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private categorizeToMuscleGroups(exerciseName: string): string[] {
    const muscleGroups: string[] = [];
    const lower = exerciseName.toLowerCase();

    const muscleMap = {
      'chest': ['chest', 'bench', 'press', 'fly', 'pec'],
      'back': ['row', 'pull', 'lat', 'back', 'deadlift'],
      'shoulders': ['shoulder', 'overhead', 'military', 'lateral', 'rear delt'],
      'biceps': ['bicep', 'curl', 'hammer', 'preacher'],
      'triceps': ['tricep', 'dip', 'close grip', 'overhead'],
      'quadriceps': ['squat', 'quad', 'leg press', 'lunge', 'extension'],
      'hamstrings': ['hamstring', 'deadlift', 'curl', 'romanian'],
      'glutes': ['glute', 'hip thrust', 'bridge', 'deadlift'],
      'calves': ['calf', 'raise'],
      'core': ['abs', 'core', 'plank', 'crunch', 'oblique'],
    };

    Object.entries(muscleMap).forEach(([muscle, keywords]) => {
      if (keywords.some(keyword => lower.includes(keyword))) {
        muscleGroups.push(muscle);
      }
    });

    return muscleGroups.length > 0 ? muscleGroups : ['other'];
  }
}

// Export singleton instance
export const simplifiedWorkoutAnalyzer = new SimplifiedWorkoutAnalyzer();