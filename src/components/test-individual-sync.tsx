"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SyncResult {
  synced: number
  failed: number
  errors: Array<{ exerciseId?: string; routineId?: string; folderId?: string; error: string }>
}

interface SyncResponse {
  success: boolean
  message: string
  result?: SyncResult
  error?: string
}

export function TestIndividualSync() {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, SyncResponse>>({})

  const syncType = async (type: 'exercises' | 'routines' | 'routine-folders' | 'workouts') => {
    setIsLoading(prev => ({ ...prev, [type]: true }))
    
    try {
      const response = await fetch(`/api/sync/${type}`, { method: 'POST' })
      const data: SyncResponse = await response.json()
      
      setResults(prev => ({ ...prev, [type]: data }))
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [type]: { 
          success: false, 
          message: 'Network error',
          error: error instanceof Error ? error.message : 'Unknown error'
        } 
      }))
    } finally {
      setIsLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  const syncAll = async () => {
    setIsLoading(prev => ({ ...prev, full: true }))
    
    try {
      const response = await fetch('/api/sync/full', { method: 'POST' })
      const data: SyncResponse = await response.json()
      
      setResults(prev => ({ ...prev, full: data }))
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        full: { 
          success: false, 
          message: 'Network error',
          error: error instanceof Error ? error.message : 'Unknown error'
        } 
      }))
    } finally {
      setIsLoading(prev => ({ ...prev, full: false }))
    }
  }

  const renderResult = (type: string, result?: SyncResponse) => {
    if (!result) return null

    return (
      <div className="mt-2 p-2 border rounded text-sm">
        <div className={`font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.success ? '✅' : '❌'} {result.message}
        </div>
        {result.result && (
          <div className="mt-1 text-gray-600">
            Synced: {result.result.synced}, Failed: {result.result.failed}
            {result.result.errors.length > 0 && (
              <div className="mt-1">
                <div className="font-medium">Errors:</div>
                {result.result.errors.slice(0, 3).map((error, i) => (
                  <div key={i} className="text-xs text-red-600">
                    {error.exerciseId || error.routineId || error.folderId}: {error.error}
                  </div>
                ))}
                {result.result.errors.length > 3 && (
                  <div className="text-xs text-gray-500">
                    ... and {result.result.errors.length - 3} more errors
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {result.error && (
          <div className="mt-1 text-red-600 text-xs">{result.error}</div>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Individual Sync Testing</CardTitle>
        <CardDescription>
          Test each sync type individually to debug issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Button 
              onClick={() => syncType('exercises')} 
              disabled={isLoading.exercises}
              className="w-full"
            >
              {isLoading.exercises ? 'Syncing...' : 'Sync Exercises'}
            </Button>
            {renderResult('exercises', results.exercises)}
          </div>

          <div>
            <Button 
              onClick={() => syncType('routine-folders')} 
              disabled={isLoading['routine-folders']}
              className="w-full"
            >
              {isLoading['routine-folders'] ? 'Syncing...' : 'Sync Folders'}
            </Button>
            {renderResult('routine-folders', results['routine-folders'])}
          </div>

          <div>
            <Button 
              onClick={() => syncType('routines')} 
              disabled={isLoading.routines}
              className="w-full"
            >
              {isLoading.routines ? 'Syncing...' : 'Sync Routines'}
            </Button>
            {renderResult('routines', results.routines)}
          </div>

          <div>
            <Button 
              onClick={() => syncType('workouts')} 
              disabled={isLoading.workouts}
              className="w-full"
            >
              {isLoading.workouts ? 'Syncing...' : 'Sync Workouts'}
            </Button>
            {renderResult('workouts', results.workouts)}
          </div>
        </div>

        <div className="border-t pt-4">
          <Button 
            onClick={syncAll} 
            disabled={isLoading.full}
            className="w-full"
            variant="outline"
          >
            {isLoading.full ? 'Syncing...' : 'Full Sync (All Types)'}
          </Button>
          {renderResult('full', results.full)}
        </div>

        <div className="text-xs text-gray-500">
          💡 Tip: Sync folders first, then routines (routines depend on folders)
        </div>
      </CardContent>
    </Card>
  )
}