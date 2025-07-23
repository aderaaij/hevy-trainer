'use client';

import { useState } from 'react';
import { workoutService } from '@/lib/hevy';
import type { HevyWorkoutsResponse, HevyApiError } from '@/lib/hevy';

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
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Hevy Workout Service Test</h2>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleGetWorkouts}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get Workouts (Page 1)'}
        </button>
        
        <button
          onClick={handleGetRecentWorkouts}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get Recent Workouts'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {workouts && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">API Response Summary</h3>
            <p>Page: {workouts.page} of {workouts.page_count}</p>
            <p>Workouts: {workouts.workouts.length}</p>
          </div>

          <div className="space-y-4">
            {workouts.workouts.map((workout) => (
              <div key={workout.id} className="p-4 border rounded-lg">
                <h4 className="font-semibold text-lg">{workout.title}</h4>
                {workout.description && (
                  <p className="text-gray-600 mb-2">{workout.description}</p>
                )}
                <div className="text-sm text-gray-500 mb-3">
                  <p>Date: {new Date(workout.start_time).toLocaleDateString()}</p>
                  <p>Duration: {Math.round((new Date(workout.end_time).getTime() - new Date(workout.start_time).getTime()) / 60000)} minutes</p>
                  <p>Exercises: {workout.exercises.length}</p>
                </div>
                
                <div className="space-y-2">
                  {workout.exercises.map((exercise) => (
                    <div key={exercise.index} className="pl-4 border-l-2 border-gray-200">
                      <p className="font-medium">{exercise.title}</p>
                      <p className="text-sm text-gray-600">{exercise.sets.length} sets</p>
                      {exercise.notes && (
                        <p className="text-sm italic text-gray-500">&ldquo;{exercise.notes}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}