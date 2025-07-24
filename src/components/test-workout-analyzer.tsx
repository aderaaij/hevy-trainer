"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { analysisService } from '@/lib/analysis/analysis-service';
import { WorkoutAnalysis, UserProfile } from '@/lib/analysis/workout-analyzer';

export default function TestWorkoutAnalyzer() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<WorkoutAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sample user profile for testing
  const sampleUserProfile: UserProfile = {
    age: 28,
    weight: 75,
    injuries: ['lower back'],
    goals: ['build muscle', 'increase strength'],
    experience: 'intermediate'
  };

  const runAnalysis = async (analysisType: 'full' | 'recent' | 'quick') => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result: WorkoutAnalysis;
      
      switch (analysisType) {
        case 'full':
          result = await analysisService.analyzeUserWorkouts(sampleUserProfile);
          break;
        case 'recent':
          result = await analysisService.analyzeRecentTrends(sampleUserProfile);
          break;
        case 'quick':
          result = await analysisService.quickAnalysis(sampleUserProfile, 10);
          break;
        default:
          throw new Error('Invalid analysis type');
      }
      
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeVariant = (value: string) => {
    const variants = {
      beginner: 'secondary',
      intermediate: 'default',
      advanced: 'destructive',
      low: 'secondary',
      moderate: 'default',
      high: 'destructive',
      improving: 'default',
      maintaining: 'secondary',
      declining: 'destructive',
      stable: 'secondary',
      increasing: 'default',
      decreasing: 'destructive',
      erratic: 'outline',
      hypertrophy: 'default',
      strength: 'secondary',
      power: 'destructive',
      deload: 'outline',
      maintenance: 'secondary'
    } as const;
    
    return variants[value as keyof typeof variants] || 'outline';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workout Analyzer Test</CardTitle>
          <CardDescription>
            Test the workout analysis system with your Hevy data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => runAnalysis('quick')} 
              disabled={isLoading}
              variant="outline"
            >
              Quick Analysis (10 workouts)
            </Button>
            <Button 
              onClick={() => runAnalysis('recent')} 
              disabled={isLoading}
              variant="outline"
            >
              Recent Trends (8 weeks)
            </Button>
            <Button 
              onClick={() => runAnalysis('full')} 
              disabled={isLoading}
            >
              Full Analysis (All workouts)
            </Button>
          </div>
          
          {isLoading && (
            <div className="text-center py-8">
              <div className="text-lg">Analyzing workouts...</div>
              <div className="text-sm text-muted-foreground mt-2">
                Fetching and processing your workout data
              </div>
            </div>
          )}
          
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-red-800">
                  <strong>Error:</strong> {error}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="phase">Phase</TabsTrigger>
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Training Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Workouts/Week:</span>
                    <span className="font-medium">{analysis.trainingMetrics.averageWorkoutsPerWeek.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Volume:</span>
                    <span className="font-medium">{Math.round(analysis.trainingMetrics.averageVolume)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Training Age:</span>
                    <Badge variant={getBadgeVariant(analysis.trainingMetrics.trainingAge)}>
                      {analysis.trainingMetrics.trainingAge}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Consistency:</span>
                    <span className="font-medium">{Math.round(analysis.trainingMetrics.consistency)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recovery Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Performance:</span>
                    <Badge variant={getBadgeVariant(analysis.recoveryStatus.performanceTrend)}>
                      {analysis.recoveryStatus.performanceTrend}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Fatigue Level:</span>
                    <Badge variant={getBadgeVariant(analysis.recoveryStatus.fatigueLevel)}>
                      {analysis.recoveryStatus.fatigueLevel}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Recommended Intensity:</span>
                    <span className="font-medium">{analysis.recoveryStatus.recommendedIntensity}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Current Phase</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Phase:</span>
                    <Badge variant={getBadgeVariant(analysis.currentPhase.current)}>
                      {analysis.currentPhase.current}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Weeks in Phase:</span>
                    <span className="font-medium">{analysis.currentPhase.weeksInPhase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ready for Transition:</span>
                    <Badge variant={analysis.currentPhase.readyForTransition ? 'default' : 'secondary'}>
                      {analysis.currentPhase.readyForTransition ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="volume" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Volume Progression</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Trend:</span>
                      <Badge variant={getBadgeVariant(analysis.volumeProgression.trend)}>
                        {analysis.volumeProgression.trend}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Weekly Change:</span>
                      <span className="font-medium">{analysis.volumeProgression.weeklyChange.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Overreaching:</span>
                      <Badge variant={analysis.volumeProgression.isOverreaching ? 'destructive' : 'secondary'}>
                        {analysis.volumeProgression.isOverreaching ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Needs Deload:</span>
                      <Badge variant={analysis.volumeProgression.needsDeload ? 'destructive' : 'secondary'}>
                        {analysis.volumeProgression.needsDeload ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phase" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Training Phase Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Phase:</span>
                    <Badge variant={getBadgeVariant(analysis.currentPhase.current)}>
                      {analysis.currentPhase.current}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Weeks in Current Phase:</span>
                    <span className="font-medium">{analysis.currentPhase.weeksInPhase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ready for Phase Transition:</span>
                    <Badge variant={analysis.currentPhase.readyForTransition ? 'default' : 'secondary'}>
                      {analysis.currentPhase.readyForTransition ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exercises" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Movement Patterns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(analysis.exercisePatterns.movementPatterns).map(([pattern, count]) => (
                    <div key={pattern} className="flex justify-between">
                      <span className="capitalize">{pattern}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Exercise Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Stale Exercises:</div>
                    <div className="flex flex-wrap gap-1">
                      {analysis.exercisePatterns.exerciseRotation.stale.length > 0 ? (
                        analysis.exercisePatterns.exerciseRotation.stale.map(exercise => (
                          <Badge key={exercise} variant="destructive" className="text-xs">
                            {exercise}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Missing Patterns:</div>
                    <div className="flex flex-wrap gap-1">
                      {analysis.exercisePatterns.exerciseRotation.missing.length > 0 ? (
                        analysis.exercisePatterns.exerciseRotation.missing.map(pattern => (
                          <Badge key={pattern} variant="outline" className="text-xs">
                            {pattern}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Weak Points:</div>
                    <div className="flex flex-wrap gap-1">
                      {analysis.exercisePatterns.weakPoints.length > 0 ? (
                        analysis.exercisePatterns.weakPoints.map(weakPoint => (
                          <Badge key={weakPoint} variant="secondary" className="text-xs">
                            {weakPoint}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None identified</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Training Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Next Phase:</span>
                      <Badge variant={getBadgeVariant(analysis.recommendations.nextPhase)}>
                        {analysis.recommendations.nextPhase}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Volume Adjustment:</span>
                      <span className={`font-medium ${analysis.recommendations.volumeAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.recommendations.volumeAdjustment > 0 ? '+' : ''}{analysis.recommendations.volumeAdjustment}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium mb-1">Focus Areas:</div>
                      <div className="flex flex-wrap gap-1">
                        {analysis.recommendations.focusAreas.length > 0 ? (
                          analysis.recommendations.focusAreas.map(area => (
                            <Badge key={area} variant="default" className="text-xs">
                              {area}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Exercises to Add:</div>
                    <div className="flex flex-wrap gap-1">
                      {analysis.recommendations.exercisesToAdd.length > 0 ? (
                        analysis.recommendations.exercisesToAdd.map(exercise => (
                          <Badge key={exercise} variant="default" className="text-xs">
                            {exercise}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Exercises to Remove:</div>
                    <div className="flex flex-wrap gap-1">
                      {analysis.recommendations.exercisesToRemove.length > 0 ? (
                        analysis.recommendations.exercisesToRemove.map(exercise => (
                          <Badge key={exercise} variant="destructive" className="text-xs">
                            {exercise}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}