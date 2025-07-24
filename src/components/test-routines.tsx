'use client';

import { useState } from 'react';
import { routineService } from '@/lib/hevy';
import type { HevyRoutinesResponse, Routine, HevyApiError } from '@/lib/hevy';

/**
 * Test component for the Hevy Routine Service
 */
export function TestRoutines() {
  const [routines, setRoutines] = useState<HevyRoutinesResponse | null>(null);
  const [singleRoutine, setSingleRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetRoutines = async (page: number = 1, pageSize: number = 5) => {
    setLoading(true);
    setError(null);
    setSingleRoutine(null);
    
    try {
      const response = await routineService.getRoutines({ page, pageSize });
      setRoutines(response);
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetSingleRoutine = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const routine = await routineService.getRoutine(id);
      setSingleRoutine(routine);
      setRoutines(null);
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSimpleRoutine = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const routine = await routineService.createSimpleRoutine(
        `Test Routine ${Date.now()}`,
        [
          {
            exercise_template_id: 'D04AC939', // Squat
            weight_kg: 60,
            reps: 10,
            sets: 3,
            rest_seconds: 90,
            notes: 'Focus on form',
          },
        ],
        {
          notes: 'Created via test component',
        }
      );
      setSingleRoutine(routine);
      setRoutines(null);
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Routine Service Test</h2>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => handleGetRoutines(1, 5)}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get Routines'}
        </button>
        
        <button
          onClick={() => handleGetRoutines(1, 10)}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get 10 Routines'}
        </button>

        <button
          onClick={handleCreateSimpleRoutine}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Create Test Routine'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {singleRoutine && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-lg mb-2">Single Routine Details</h3>
          <div className="space-y-2 text-sm">
            <p><strong>ID:</strong> {singleRoutine.id}</p>
            <p><strong>Title:</strong> {singleRoutine.title}</p>
            <p><strong>Notes:</strong> {singleRoutine.notes || 'None'}</p>
            <p><strong>Folder ID:</strong> {singleRoutine.folder_id || 'None'}</p>
            <p><strong>Exercises:</strong> {singleRoutine.exercises.length}</p>
            <p><strong>Created:</strong> {new Date(singleRoutine.created_at).toLocaleString()}</p>
            <p><strong>Updated:</strong> {new Date(singleRoutine.updated_at).toLocaleString()}</p>
            
            {singleRoutine.exercises.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Exercises:</h4>
                <div className="space-y-2">
                  {singleRoutine.exercises.map((exercise, index) => (
                    <div key={index} className="pl-4 border-l-2 border-gray-300">
                      <p><strong>Template ID:</strong> {exercise.exercise_template_id}</p>
                      <p><strong>Sets:</strong> {exercise.sets.length}</p>
                      <p><strong>Rest:</strong> {exercise.rest_seconds}s</p>
                      {exercise.notes && <p><strong>Notes:</strong> {exercise.notes}</p>}
                      
                      <div className="mt-1 text-xs text-gray-600">
                        <p>Sets: {exercise.sets.map(set => 
                          `${set.weight_kg}kg × ${set.reps} (${set.rep_range.start}-${set.rep_range.end})`
                        ).join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {routines && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">API Response Summary</h3>
            <p>Page: {routines.page} of {routines.page_count}</p>
            <p>Routines: {routines.routines.length}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routines.routines.map((routine) => (
              <div 
                key={routine.id} 
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleGetSingleRoutine(routine.id)}
              >
                <h4 className="font-semibold text-lg">{routine.title}</h4>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p><strong>Exercises:</strong> {routine.exercises.length}</p>
                  {routine.notes && <p><strong>Notes:</strong> {routine.notes}</p>}
                  <p><strong>Created:</strong> {new Date(routine.created_at).toLocaleDateString()}</p>
                  {routine.folder_id && (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded mt-2">
                      In Folder: {routine.folder_id}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Click to view details</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}