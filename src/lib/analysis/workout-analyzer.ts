import { Workout } from '@/lib/hevy/types/workouts';

export interface WorkoutAnalysis {
  trainingMetrics: TrainingMetrics;
  volumeProgression: VolumeProgression;
  currentPhase: TrainingPhase;
  exercisePatterns: ExercisePatterns;
  recoveryStatus: RecoveryStatus;
  recommendations: TrainingRecommendations;
}

interface TrainingMetrics {
  averageWorkoutsPerWeek: number;
  averageVolume: number;
  averageIntensity: number;
  trainingAge: 'beginner' | 'intermediate' | 'advanced';
  consistency: number; // 0-100%
}

interface VolumeProgression {
  trend: 'increasing' | 'decreasing' | 'stable' | 'erratic';
  weeklyChange: number; // percentage
  isOverreaching: boolean;
  needsDeload: boolean;
}

interface TrainingPhase {
  current: 'hypertrophy' | 'strength' | 'power' | 'deload' | 'maintenance';
  weeksInPhase: number;
  readyForTransition: boolean;
}

interface ExercisePatterns {
  muscleGroupFrequency: Record<string, number>;
  movementPatterns: {
    push: number;
    pull: number;
    legs: number;
    core: number;
  };
  exerciseRotation: {
    stale: string[]; // exercises done too frequently
    missing: string[]; // movement patterns not covered
  };
  weakPoints: string[]; // muscle groups lagging
}

interface RecoveryStatus {
  performanceTrend: 'improving' | 'maintaining' | 'declining';
  fatigueLevel: 'low' | 'moderate' | 'high';
  recommendedIntensity: number; // 0-100%
}

interface TrainingRecommendations {
  nextPhase: TrainingPhase['current'];
  volumeAdjustment: number; // percentage change
  focusAreas: string[];
  exercisesToAdd: string[];
  exercisesToRemove: string[];
}

export interface UserProfile {
  age: number;
  weight: number;
  injuries: string[];
  goals: string[];
  experience: string;
}

export class WorkoutAnalyzer {
  /**
   * Main analysis function that processes workout history
   */
  async analyzeWorkoutHistory(
    workouts: Workout[],
    userProfile: UserProfile
  ): Promise<WorkoutAnalysis> {
    // Sort workouts by date
    const sortedWorkouts = this.sortWorkoutsByDate(workouts);
    
    // Calculate core metrics
    const trainingMetrics = this.calculateTrainingMetrics(sortedWorkouts);
    const volumeProgression = this.analyzeVolumeProgression(sortedWorkouts);
    const currentPhase = this.detectTrainingPhase(sortedWorkouts);
    const exercisePatterns = this.analyzeExercisePatterns(sortedWorkouts);
    const recoveryStatus = this.assessRecoveryStatus(sortedWorkouts);
    
    // Generate recommendations based on analysis
    const recommendations = this.generateRecommendations({
      trainingMetrics,
      volumeProgression,
      currentPhase,
      exercisePatterns,
      recoveryStatus,
      userProfile,
    });

    return {
      trainingMetrics,
      volumeProgression,
      currentPhase,
      exercisePatterns,
      recoveryStatus,
      recommendations,
    };
  }

  /**
   * Calculate average workouts per week and training consistency
   */
  private calculateTrainingMetrics(workouts: Workout[]): TrainingMetrics {
    if (workouts.length === 0) {
      return {
        averageWorkoutsPerWeek: 0,
        averageVolume: 0,
        averageIntensity: 0,
        trainingAge: 'beginner',
        consistency: 0,
      };
    }

    // Get date range
    const firstWorkout = new Date(workouts[0].start_time);
    const lastWorkout = new Date(workouts[workouts.length - 1].start_time);
    const weeksDiff = this.getWeeksDifference(firstWorkout, lastWorkout);

    // Calculate workouts per week
    const averageWorkoutsPerWeek = workouts.length / Math.max(weeksDiff, 1);

    // Calculate average volume per workout
    const totalVolume = workouts.reduce((sum, workout) => {
      return sum + this.calculateWorkoutVolume(workout);
    }, 0);
    const averageVolume = totalVolume / workouts.length;

    // Calculate average intensity (based on RPE if available, or estimated)
    const averageIntensity = this.calculateAverageIntensity(workouts);

    // Determine training age based on volume and consistency
    const trainingAge = this.determineTrainingAge(workouts);

    // Calculate consistency score
    const consistency = this.calculateConsistency(workouts);

    return {
      averageWorkoutsPerWeek,
      averageVolume,
      averageIntensity,
      trainingAge,
      consistency,
    };
  }

  /**
   * Analyze volume trends over time
   */
  private analyzeVolumeProgression(workouts: Workout[]): VolumeProgression {
    const weeklyVolumes = this.calculateWeeklyVolumes(workouts);
    
    if (weeklyVolumes.length < 2) {
      return {
        trend: 'stable',
        weeklyChange: 0,
        isOverreaching: false,
        needsDeload: false,
      };
    }

    // Calculate trend
    const trend = this.calculateVolumeTrend(weeklyVolumes);
    
    // Calculate average weekly change
    const weeklyChange = this.calculateWeeklyVolumeChange(weeklyVolumes);
    
    // Check for overreaching (volume increased >20% for 3+ weeks)
    const isOverreaching = this.checkOverreaching(weeklyVolumes);
    
    // Check if deload needed (4+ weeks of increasing volume or high fatigue)
    const needsDeload = this.checkDeloadNeed(weeklyVolumes, workouts);

    return {
      trend,
      weeklyChange,
      isOverreaching,
      needsDeload,
    };
  }

  /**
   * Detect current training phase based on rep ranges and volume
   */
  private detectTrainingPhase(workouts: Workout[]): TrainingPhase {
    const recentWorkouts = workouts.slice(-8); // Last 2-3 weeks
    
    if (recentWorkouts.length === 0) {
      return {
        current: 'hypertrophy',
        weeksInPhase: 0,
        readyForTransition: false,
      };
    }

    // Analyze rep ranges
    const avgReps = this.calculateAverageReps(recentWorkouts);
    const volumeIntensity = this.calculateVolumeIntensity(recentWorkouts);

    // Determine phase based on rep ranges and volume
    let current: TrainingPhase['current'];
    if (avgReps <= 5) {
      current = 'strength';
    } else if (avgReps <= 3) {
      current = 'power';
    } else if (avgReps >= 12 || volumeIntensity < 0.7) {
      current = 'deload';
    } else if (avgReps >= 8 && avgReps <= 12) {
      current = 'hypertrophy';
    } else {
      current = 'maintenance';
    }

    // Calculate weeks in current phase
    const weeksInPhase = this.calculateWeeksInPhase(workouts);
    
    // Check if ready for phase transition
    const readyForTransition = this.checkPhaseTransition(current, weeksInPhase);

    return {
      current,
      weeksInPhase,
      readyForTransition,
    };
  }

  /**
   * Analyze exercise selection patterns
   */
  private analyzeExercisePatterns(workouts: Workout[]): ExercisePatterns {
    const exerciseFrequency: Record<string, number> = {};
    const muscleGroupFrequency: Record<string, number> = {};
    const movementPatterns = {
      push: 0,
      pull: 0,
      legs: 0,
      core: 0,
    };

    // Count exercise and muscle group frequency
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exerciseFrequency[exercise.title] = 
          (exerciseFrequency[exercise.title] || 0) + 1;
        
        // Map to movement patterns
        const pattern = this.categorizeMovementPattern(exercise.title);
        if (pattern) {
          movementPatterns[pattern]++;
        }

        // Map to muscle groups
        const muscleGroups = this.categorizeToMuscleGroups(exercise.title);
        muscleGroups.forEach(group => {
          muscleGroupFrequency[group] = (muscleGroupFrequency[group] || 0) + 1;
        });
      });
    });

    // Identify stale exercises (done >80% of workouts)
    const totalWorkouts = workouts.length;
    const stale = Object.entries(exerciseFrequency)
      .filter(([, freq]) => freq / totalWorkouts > 0.8)
      .map(([exercise]) => exercise);

    // Identify missing movement patterns
    const missing = this.identifyMissingPatterns(movementPatterns);

    // Identify weak points based on volume distribution
    const weakPoints = this.identifyWeakPoints(muscleGroupFrequency);

    return {
      muscleGroupFrequency,
      movementPatterns,
      exerciseRotation: { stale, missing },
      weakPoints,
    };
  }

  /**
   * Assess recovery status based on performance trends
   */
  private assessRecoveryStatus(workouts: Workout[]): RecoveryStatus {
    if (workouts.length < 4) {
      return {
        performanceTrend: 'maintaining',
        fatigueLevel: 'low',
        recommendedIntensity: 85,
      };
    }

    // Compare recent performance to baseline
    const recentWorkouts = workouts.slice(-4);
    const baselineWorkouts = workouts.slice(-12, -4);
    
    const performanceTrend = this.comparePerformance(recentWorkouts, baselineWorkouts);
    const fatigueLevel = this.assessFatigue(workouts);
    
    // Recommend intensity based on fatigue
    const recommendedIntensity = fatigueLevel === 'high' ? 70 : 
                                fatigueLevel === 'moderate' ? 80 : 90;

    return {
      performanceTrend,
      fatigueLevel,
      recommendedIntensity,
    };
  }

  /**
   * Generate training recommendations
   */
  private generateRecommendations(
    analysis: Omit<WorkoutAnalysis, 'recommendations'> & {
      userProfile: UserProfile;
    }
  ): TrainingRecommendations {
    const { currentPhase, volumeProgression, exercisePatterns, recoveryStatus } = analysis;

    // Determine next phase
    let nextPhase = currentPhase.current;
    if (currentPhase.readyForTransition) {
      nextPhase = this.getNextPhase(currentPhase.current);
    } else if (volumeProgression.needsDeload) {
      nextPhase = 'deload';
    }

    // Calculate volume adjustment
    const volumeAdjustment = this.calculateVolumeAdjustment(
      volumeProgression,
      recoveryStatus
    );

    // Determine focus areas
    const focusAreas = exercisePatterns.weakPoints;

    // Exercise recommendations
    const exercisesToAdd = exercisePatterns.exerciseRotation.missing;
    const exercisesToRemove = exercisePatterns.exerciseRotation.stale;

    return {
      nextPhase,
      volumeAdjustment,
      focusAreas,
      exercisesToAdd,
      exercisesToRemove,
    };
  }

  // Helper methods
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

  private calculateAverageIntensity(workouts: Workout[]): number {
    // Calculate based on RPE if available
    let totalRPE = 0;
    let rpeCount = 0;

    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.rpe !== null) {
            totalRPE += set.rpe;
            rpeCount++;
          }
        });
      });
    });

    // If RPE data available, convert to percentage (RPE 10 = 100%)
    if (rpeCount > 0) {
      return (totalRPE / rpeCount) * 10;
    }

    // Otherwise estimate based on rep ranges
    return this.estimateIntensityFromReps(workouts);
  }

  private estimateIntensityFromReps(workouts: Workout[]): number {
    const avgReps = this.calculateAverageReps(workouts);
    
    // Rep-based intensity estimation
    if (avgReps <= 3) return 90; // Power/max strength
    if (avgReps <= 5) return 85; // Strength
    if (avgReps <= 8) return 80; // Strength-hypertrophy
    if (avgReps <= 12) return 75; // Hypertrophy
    return 65; // Endurance/deload
  }

  private determineTrainingAge(workouts: Workout[]): TrainingMetrics['trainingAge'] {
    const totalVolume = workouts.reduce((sum, w) => sum + this.calculateWorkoutVolume(w), 0);
    const avgVolume = totalVolume / workouts.length;
    const consistency = this.calculateConsistency(workouts);
    
    // More sophisticated training age determination
    if (avgVolume < 3000 || consistency < 60) return 'beginner';
    if (avgVolume < 8000 || consistency < 80) return 'intermediate';
    return 'advanced';
  }

  private calculateConsistency(workouts: Workout[]): number {
    if (workouts.length < 4) return 0;

    const firstDate = new Date(workouts[0].start_time);
    const lastDate = new Date(workouts[workouts.length - 1].start_time);
    const totalWeeks = this.getWeeksDifference(firstDate, lastDate);
    
    // Group workouts by week
    const weeklyWorkouts = this.groupWorkoutsByWeek(workouts);
    const weeksWithWorkouts = Object.keys(weeklyWorkouts).length;
    
    // Calculate consistency as percentage of weeks with workouts
    return Math.min(100, (weeksWithWorkouts / totalWeeks) * 100);
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

  private calculateWeeklyVolumes(workouts: Workout[]): number[] {
    const weeklyWorkouts = this.groupWorkoutsByWeek(workouts);
    
    return Object.values(weeklyWorkouts).map(weekWorkouts => {
      return weekWorkouts.reduce((sum, workout) => {
        return sum + this.calculateWorkoutVolume(workout);
      }, 0);
    });
  }

  private calculateVolumeTrend(weeklyVolumes: number[]): VolumeProgression['trend'] {
    if (weeklyVolumes.length < 3) return 'stable';

    // Calculate moving average to smooth out weekly variations
    const smoothedVolumes = this.calculateMovingAverage(weeklyVolumes, 3);
    
    // Compare recent trend to overall trend
    const recentTrend = this.calculateLinearTrend(smoothedVolumes.slice(-4));
    const overallTrend = this.calculateLinearTrend(smoothedVolumes);
    
    const threshold = 0.1; // 10% change threshold
    
    if (Math.abs(recentTrend) < threshold) return 'stable';
    if (recentTrend > threshold && overallTrend > 0) return 'increasing';
    if (recentTrend < -threshold && overallTrend < 0) return 'decreasing';
    return 'erratic';
  }

  private calculateMovingAverage(values: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - window + 1);
      const windowValues = values.slice(start, i + 1);
      const avg = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
      result.push(avg);
    }
    return result;
  }

  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0,1,2,...,n-1
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = values.reduce((sum, _, index) => sum + (index * index), 0);
    
    // Calculate slope of linear regression
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Normalize slope by average value to get percentage change per period
    const avgValue = sumY / n;
    return avgValue > 0 ? slope / avgValue : 0;
  }

  private calculateWeeklyVolumeChange(weeklyVolumes: number[]): number {
    if (weeklyVolumes.length < 2) return 0;

    let totalChange = 0;
    let changes = 0;

    for (let i = 1; i < weeklyVolumes.length; i++) {
      if (weeklyVolumes[i - 1] > 0) {
        const change = ((weeklyVolumes[i] - weeklyVolumes[i - 1]) / weeklyVolumes[i - 1]) * 100;
        totalChange += change;
        changes++;
      }
    }

    return changes > 0 ? totalChange / changes : 0;
  }

  private checkOverreaching(weeklyVolumes: number[]): boolean {
    if (weeklyVolumes.length < 4) return false;

    const recentWeeks = weeklyVolumes.slice(-4);
    let consecutiveIncreases = 0;
    let totalIncrease = 0;

    for (let i = 1; i < recentWeeks.length; i++) {
      if (recentWeeks[i] > recentWeeks[i - 1] * 1.1) { // >10% increase
        consecutiveIncreases++;
        totalIncrease += ((recentWeeks[i] - recentWeeks[i - 1]) / recentWeeks[i - 1]);
      } else {
        consecutiveIncreases = 0;
      }
    }

    return consecutiveIncreases >= 3 || totalIncrease > 0.5; // 50% total increase
  }

  private checkDeloadNeed(weeklyVolumes: number[], workouts: Workout[]): boolean {
    // Check volume-based deload need
    const volumeDeload = this.checkOverreaching(weeklyVolumes);
    
    // Check time-based deload need (4+ weeks since last deload)
    // This would require tracking previous deloads - simplified for now
    const timeDeload = weeklyVolumes.length >= 6;
    
    // Check fatigue-based deload need
    const fatigueLevel = this.assessFatigue(workouts);
    const fatigueDeload = fatigueLevel === 'high';

    return volumeDeload || timeDeload || fatigueDeload;
  }

  private calculateAverageReps(workouts: Workout[]): number {
    let totalReps = 0;
    let totalSets = 0;
    
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          // Only count work sets (exclude warmup sets)
          if (set.type === 'normal' || set.type === 'failure' || set.type === 'drop') {
            totalReps += set.reps;
            totalSets++;
          }
        });
      });
    });
    
    return totalSets > 0 ? totalReps / totalSets : 10;
  }

  private calculateVolumeIntensity(workouts: Workout[]): number {
    // Calculate relative intensity based on volume and average weight
    const avgVolume = workouts.reduce((sum, w) => sum + this.calculateWorkoutVolume(w), 0) / workouts.length;
    const avgIntensity = this.calculateAverageIntensity(workouts);
    
    // Combine volume and intensity metrics (normalized to 0-1 scale)
    const normalizedVolume = Math.min(1, avgVolume / 10000); // Normalize against 10kg baseline
    const normalizedIntensity = avgIntensity / 100;
    
    return (normalizedVolume + normalizedIntensity) / 2;
  }

  private calculateWeeksInPhase(workouts: Workout[]): number {
    // Simple implementation - count backwards until phase characteristics change
    // This would be more sophisticated with historical phase tracking
    const recentWorkouts = workouts.slice(-12); // Last 3 months
    const weeksAnalyzed = Math.min(12, recentWorkouts.length);
    
    // For now, estimate based on current characteristics
    return Math.min(weeksAnalyzed / 4, 8); // Max 8 weeks per phase
  }

  private checkPhaseTransition(phase: TrainingPhase['current'], weeks: number): boolean {
    const phaseDurations = {
      hypertrophy: 6,
      strength: 4,
      power: 3,
      deload: 1,
      maintenance: 8,
    };
    
    return weeks >= phaseDurations[phase];
  }

  private categorizeMovementPattern(exerciseName: string): keyof ExercisePatterns['movementPatterns'] | null {
    const patterns = {
      push: [
        'press', 'push', 'dip', 'fly', 'chest', 'bench', 'shoulder', 'overhead',
        'tricep', 'military', 'incline', 'decline', 'pushup'
      ],
      pull: [
        'row', 'pull', 'curl', 'pulldown', 'pullup', 'chinup', 'lat', 'back',
        'bicep', 'hammer', 'preacher', 'cable', 'machine', 'barbell curl'
      ],
      legs: [
        'squat', 'lunge', 'deadlift', 'leg', 'calf', 'quad', 'hamstring',
        'glute', 'hip', 'thigh', 'step', 'split', 'bulgarian'
      ],
      core: [
        'plank', 'crunch', 'abs', 'core', 'oblique', 'russian', 'mountain',
        'hanging', 'knee', 'sit', 'twist'
      ],
    };
    
    const lower = exerciseName.toLowerCase();
    for (const [pattern, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        return pattern as keyof ExercisePatterns['movementPatterns'];
      }
    }
    
    return null;
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

    return muscleGroups.length > 0 ? muscleGroups : ['unknown'];
  }

  private identifyMissingPatterns(patterns: ExercisePatterns['movementPatterns']): string[] {
    const missing: string[] = [];
    const minFrequency = 2; // Minimum exercises per pattern

    Object.entries(patterns).forEach(([pattern, count]) => {
      if (count < minFrequency) {
        missing.push(pattern);
      }
    });

    return missing;
  }

  private identifyWeakPoints(muscleFrequency: Record<string, number>): string[] {
    if (Object.keys(muscleFrequency).length === 0) return [];

    const totalExercises = Object.values(muscleFrequency).reduce((sum, freq) => sum + freq, 0);
    const avgPerMuscle = totalExercises / Object.keys(muscleFrequency).length;
    
    // Identify muscle groups with significantly less volume
    return Object.entries(muscleFrequency)
      .filter(([, freq]) => freq < avgPerMuscle * 0.7) // Less than 70% of average
      .map(([muscle]) => muscle);
  }

  private comparePerformance(recent: Workout[], baseline: Workout[]): RecoveryStatus['performanceTrend'] {
    if (recent.length === 0 || baseline.length === 0) return 'maintaining';

    const recentAvgVolume = recent.reduce((sum, w) => sum + this.calculateWorkoutVolume(w), 0) / recent.length;
    const baselineAvgVolume = baseline.reduce((sum, w) => sum + this.calculateWorkoutVolume(w), 0) / baseline.length;
    
    const changePercent = ((recentAvgVolume - baselineAvgVolume) / baselineAvgVolume) * 100;
    
    if (changePercent > 5) return 'improving';
    if (changePercent < -5) return 'declining';
    return 'maintaining';
  }

  private assessFatigue(workouts: Workout[]): RecoveryStatus['fatigueLevel'] {
    if (workouts.length < 4) return 'low';

    // Assess fatigue based on volume trend and workout frequency
    const recentWorkouts = workouts.slice(-8);
    const volumeTrend = this.calculateWeeklyVolumeChange(this.calculateWeeklyVolumes(recentWorkouts));
    
    // High fatigue indicators
    if (volumeTrend > 15 || recentWorkouts.length / 2 > 5) return 'high'; // >15% volume increase or >5 workouts/week
    if (volumeTrend > 8 || recentWorkouts.length / 2 > 4) return 'moderate'; // >8% volume increase or >4 workouts/week
    
    return 'low';
  }

  private getNextPhase(current: TrainingPhase['current']): TrainingPhase['current'] {
    const phaseProgression: Record<TrainingPhase['current'], TrainingPhase['current']> = {
      hypertrophy: 'strength',
      strength: 'power',
      power: 'deload',
      deload: 'hypertrophy',
      maintenance: 'hypertrophy',
    };
    
    return phaseProgression[current];
  }

  private calculateVolumeAdjustment(
    volumeProgression: VolumeProgression,
    recoveryStatus: RecoveryStatus
  ): number {
    if (volumeProgression.needsDeload) return -30;
    if (volumeProgression.isOverreaching) return -15;
    if (recoveryStatus.fatigueLevel === 'high') return -10;
    if (recoveryStatus.performanceTrend === 'improving') return 5;
    return 0;
  }
}

// Export singleton instance
export const workoutAnalyzer = new WorkoutAnalyzer();