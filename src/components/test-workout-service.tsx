'use client';

import { useState } from 'react';
import { workoutService } from '@/lib/hevy';
import type { HevyWorkoutsResponse, HevyApiError } from '@/lib/hevy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Dumbbell, Calendar, Clock } from 'lucide-react';

/**
 * Test component for the Hevy Workout Service
 * This component can be used to test the API integration
 */
export function TestWorkoutService() {
  const [workouts, setWorkouts] = useState<HevyWorkoutsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetWorkouts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await workoutService.getWorkouts({ page: 1, pageSize: 5 });
      setWorkouts(response);
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecentWorkouts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await workoutService.getRecentWorkouts(3);
      setWorkouts(response);
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Workout Service Test
          </CardTitle>
          <CardDescription>
            Test all workout endpoints including pagination, counts, events, and CRUD operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGetWorkouts}
              disabled={loading}
              variant="default"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Workouts
            </Button>
            
            <Button
              onClick={handleGetRecentWorkouts}
              disabled={loading}
              variant="secondary"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Recent Workouts
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {workouts && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Response Summary</CardTitle>
              <CardDescription>
                Page {workouts.page} of {workouts.page_count} • {workouts.workouts.length} workouts loaded
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {workouts.workouts.map((workout) => (
              <Card key={workout.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{workout.title}</CardTitle>
                  {workout.description && (
                    <CardDescription>{workout.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(workout.start_time).toLocaleDateString()}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.round((new Date(workout.end_time).getTime() - new Date(workout.start_time).getTime()) / 60000)}m
                    </Badge>
                    <Badge variant="outline">
                      {workout.exercises.length} exercises
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {workout.exercises.slice(0, 3).map((exercise) => (
                      <div key={exercise.index} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{exercise.title}</span>
                        <Badge variant="secondary" className="text-xs">
                          {exercise.sets.length} sets
                        </Badge>
                      </div>
                    ))}
                    {workout.exercises.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        +{workout.exercises.length - 3} more exercises
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}