"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Activity,
  FileText,
  FolderOpen,
  Dumbbell
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SyncStatusData {
  workouts?: {
    totalWorkoutsCached: number
    lastSyncedAt: string | null
  }
  routines?: {
    totalRoutinesCached: number
    lastSyncedAt: string | null
  }
  routineFolders?: {
    totalFoldersCached: number
    lastSyncedAt: string | null
  }
  exercises?: {
    totalExercisesCached: number
    lastSyncedAt: string | null
  }
  counts?: {
    workouts: number
    routines: number
    exercises: number
  }
  isStale?: boolean
  daysSinceSync?: number
  recommendation?: string
  recentSyncs: Array<{
    id: string
    syncType: string
    status: string
    startedAt: string
    completedAt: string | null
    itemsSynced: number
    totalItems: number | null
  }>
}

export function SyncStatus() {
  const [status, setStatus] = useState<SyncStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load sync status
  const loadStatus = async () => {
    try {
      const response = await fetch('/api/sync/status')
      if (!response.ok) throw new Error('Failed to load sync status')
      
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status')
    } finally {
      setIsLoading(false)
    }
  }

  // Start full sync
  const startFullSync = async () => {
    setIsSyncing(true)
    setError(null)

    try {
      const response = await fetch('/api/sync/full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start sync')
      }

      // Refresh status after starting sync
      setTimeout(loadStatus, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start sync')
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    loadStatus()
    // Refresh status every 10 seconds if there's an active sync
    const interval = setInterval(() => {
      if (status?.recentSyncs.some(s => s.status === 'in_progress')) {
        loadStatus()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [status])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading sync status...
        </CardContent>
      </Card>
    )
  }

  const hasActiveSync = status?.recentSyncs.some(s => s.status === 'in_progress')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Hevy Data Sync</CardTitle>
          <Button
            size="sm"
            onClick={startFullSync}
            disabled={isSyncing || hasActiveSync}
          >
            {isSyncing || hasActiveSync ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Data Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-neutral-500" />
            <div>
              <p className="text-2xl font-semibold">
                {status?.workouts?.totalWorkoutsCached ?? status?.counts?.workouts ?? 0}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Workouts
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-neutral-500" />
            <div>
              <p className="text-2xl font-semibold">
                {status?.routines?.totalRoutinesCached ?? status?.counts?.routines ?? 0}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Routines
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-neutral-500" />
            <div>
              <p className="text-2xl font-semibold">
                {status?.routineFolders?.totalFoldersCached ?? 0}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Folders  
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Dumbbell className="h-8 w-8 text-neutral-500" />
            <div>
              <p className="text-2xl font-semibold">
                {status?.exercises?.totalExercisesCached ?? status?.counts?.exercises ?? 0}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Exercises
              </p>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Data Freshness</span>
            <Badge variant={status?.isStale ? "destructive" : "default"}>
              {status?.isStale ? "Stale" : "Fresh"}
            </Badge>
          </div>
          
          {status?.recommendation && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {status.recommendation}
            </p>
          )}

          {status?.workouts?.lastSyncedAt && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Last synced {formatDistanceToNow(new Date(status.workouts.lastSyncedAt))} ago
            </p>
          )}
        </div>

        {/* Recent Sync History */}
        {status?.recentSyncs && status.recentSyncs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Syncs</h4>
            <div className="space-y-1">
              {status.recentSyncs.slice(0, 3).map((sync) => (
                <div 
                  key={sync.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    {sync.status === 'completed' && (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    )}
                    {sync.status === 'in_progress' && (
                      <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                    )}
                    {sync.status === 'failed' && (
                      <AlertCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className="capitalize">{sync.syncType}</span>
                  </div>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {sync.itemsSynced || 0} items
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}