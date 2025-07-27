import { PrismaClient } from '@/generated/prisma'
import { hevyServerClient } from '@/app/api/hevy/lib/hevy-server-client'
import { Workout, WorkoutCountResponse, HevyWorkoutsResponse as WorkoutsResponse, HevyWorkoutEventsResponse as WorkoutEventsResponse } from '@/lib/hevy/types/workouts'

const prisma = new PrismaClient()

interface SyncResult {
  synced: number
  failed: number
  errors: Array<{ workoutId: string; error: string }>
}

export class WorkoutSyncService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Sync all workouts for a user
   * Due to Hevy API limitation (max 10 workouts per request), we need to paginate
   */
  async syncAllWorkouts(): Promise<SyncResult> {
    const result: SyncResult = {
      synced: 0,
      failed: 0,
      errors: []
    }

    try {
      // Create sync status record
      const syncStatus = await prisma.syncStatus.create({
        data: {
          userId: this.userId,
          syncType: 'workouts',
          status: 'in_progress',
        }
      })

      // Get total workout count
      console.log('Fetching workout count...')
      const countResponse = await hevyServerClient.get<WorkoutCountResponse>('/workouts/count')
      const totalWorkouts = countResponse.workout_count
      console.log(`Total workouts from Hevy API: ${totalWorkouts}`)
      
      // Update sync status with total count
      await prisma.syncStatus.update({
        where: { id: syncStatus.id },
        data: { totalItems: totalWorkouts }
      })

      // Calculate number of pages (10 workouts per page)
      const pageSize = 10 // Hevy API max limit
      const totalPages = Math.ceil(totalWorkouts / pageSize)

      // Fetch workouts page by page
      console.log(`Starting to fetch ${totalPages} pages of workouts`)
      for (let page = 1; page <= totalPages; page++) {
        try {
          console.log(`Fetching workouts page ${page}/${totalPages}`)
          const workoutsResponse = await hevyServerClient.get<WorkoutsResponse>(
            `/workouts?page=${page}&pageSize=${pageSize}`
          )
          console.log(`Page ${page} returned ${workoutsResponse.workouts?.length || 0} workouts`)

          // Process each workout in the page
          for (const workout of workoutsResponse.workouts) {
            try {
              await this.syncSingleWorkout(workout)
              result.synced++
              
              // Update progress
              await prisma.syncStatus.update({
                where: { id: syncStatus.id },
                data: { itemsSynced: result.synced }
              })
            } catch (error) {
              result.failed++
              result.errors.push({
                workoutId: workout.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Error fetching page ${page}:`, error)
          // Continue with next page even if one fails
        }
      }

      // Update sync status to completed
      await prisma.syncStatus.update({
        where: { id: syncStatus.id },
        data: {
          status: result.failed === 0 ? 'completed' : 'completed_with_errors',
          completedAt: new Date(),
          itemsSynced: result.synced,
          errorMessage: result.failed > 0 ? 
            `Failed to sync ${result.failed} workouts` : null,
          metadata: result.errors.length > 0 ? result.errors : null
        }
      })

    } catch (error) {
      console.error('Sync failed:', error)
      throw error
    }

    return result
  }

  /**
   * Sync workouts incrementally (only new/updated since last sync)
   */
  async syncIncrementalWorkouts(): Promise<SyncResult> {
    const result: SyncResult = {
      synced: 0,
      failed: 0,
      errors: []
    }

    try {
      // Get last successful sync time
      const lastSync = await prisma.importedWorkout.findFirst({
        where: { userId: this.userId },
        orderBy: { lastSyncedAt: 'desc' },
        select: { lastSyncedAt: true }
      })

      const startDate = lastSync?.lastSyncedAt || new Date(0) // If no last sync, get all
      
      // Create sync status record
      const syncStatus = await prisma.syncStatus.create({
        data: {
          userId: this.userId,
          syncType: 'workouts_incremental',
          status: 'in_progress',
        }
      })

      // Get workout events since last sync
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = new Date().toISOString().split('T')[0]
      const eventsResponse = await hevyServerClient.get<WorkoutEventsResponse>(
        `/workouts/events?startDate=${startDateStr}&endDate=${endDateStr}`
      )

      const workoutDates = eventsResponse.workout_dates || []
      
      // Update total count
      await prisma.syncStatus.update({
        where: { id: syncStatus.id },
        data: { totalItems: workoutDates.length }
      })

      // Fetch full details for each workout
      for (const date of workoutDates) {
        try {
          // Get workouts for this specific date
          const workoutsResponse = await hevyServerClient.get<WorkoutsResponse>(
            `/workouts?page=1&pageSize=10`
          )

          // Filter workouts for this date
          const workoutsOnDate = workoutsResponse.workouts.filter(
            w => w.start_time.startsWith(date)
          )

          for (const workout of workoutsOnDate) {
            try {
              await this.syncSingleWorkout(workout)
              result.synced++
              
              // Update progress
              await prisma.syncStatus.update({
                where: { id: syncStatus.id },
                data: { itemsSynced: result.synced }
              })
            } catch (error) {
              result.failed++
              result.errors.push({
                workoutId: workout.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Error fetching workouts for date ${date}:`, error)
        }
      }

      // Update sync status to completed
      await prisma.syncStatus.update({
        where: { id: syncStatus.id },
        data: {
          status: result.failed === 0 ? 'completed' : 'completed_with_errors',
          completedAt: new Date(),
          itemsSynced: result.synced,
          errorMessage: result.failed > 0 ? 
            `Failed to sync ${result.failed} workouts` : null,
          metadata: result.errors.length > 0 ? result.errors : null
        }
      })

    } catch (error) {
      console.error('Incremental sync failed:', error)
      throw error
    }

    return result
  }

  /**
   * Sync a single workout
   */
  private async syncSingleWorkout(workout: Workout): Promise<void> {
    console.log(`Syncing workout ${workout.id}: ${workout.title || 'Untitled'}`)
    
    // Get full workout details
    const fullWorkout = await hevyServerClient.get<Workout>(`/workouts/${workout.id}`)

    // Upsert workout to database
    await prisma.importedWorkout.upsert({
      where: { hevyWorkoutId: workout.id },
      update: {
        workoutData: fullWorkout as any, // Store full workout data as JSON
        name: fullWorkout.title, // Use 'title' instead of 'name'
        performedAt: new Date(fullWorkout.start_time),
        lastSyncedAt: new Date()
      },
      create: {
        userId: this.userId,
        hevyWorkoutId: workout.id,
        workoutData: fullWorkout as any,
        name: fullWorkout.title, // Use 'title' instead of 'name'
        performedAt: new Date(fullWorkout.start_time)
      }
    })
  }

  /**
   * Get sync status for the user
   */
  async getSyncStatus() {
    const latestSync = await prisma.syncStatus.findFirst({
      where: { 
        userId: this.userId,
        syncType: { in: ['workouts', 'workouts_incremental'] }
      },
      orderBy: { startedAt: 'desc' }
    })

    const workoutCount = await prisma.importedWorkout.count({
      where: { userId: this.userId }
    })

    const lastWorkoutSync = await prisma.importedWorkout.findFirst({
      where: { userId: this.userId },
      orderBy: { lastSyncedAt: 'desc' },
      select: { lastSyncedAt: true }
    })

    return {
      latestSync,
      totalWorkoutsCached: workoutCount,
      lastSyncedAt: lastWorkoutSync?.lastSyncedAt
    }
  }
}