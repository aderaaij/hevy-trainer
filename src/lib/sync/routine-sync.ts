import { PrismaClient } from '@/generated/prisma'
import { hevyServerClient } from '@/app/api/hevy/lib/hevy-server-client'
import { Routine, RoutinesResponse } from '@/lib/hevy/types/routines'

const prisma = new PrismaClient()

interface SyncResult {
  synced: number
  failed: number
  errors: Array<{ routineId: string; error: string }>
}

export class RoutineSyncService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Sync all routines for a user
   */
  async syncAllRoutines(): Promise<SyncResult> {
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
          syncType: 'routines',
          status: 'in_progress',
        }
      })

      // Fetch all routines (pagination if needed)
      let page = 1
      let hasMore = true

      while (hasMore) {
        try {
          const routinesResponse = await hevyServerClient.get<RoutinesResponse>(
            `/routines?page=${page}&pageSize=20`
          )

          const routines = routinesResponse.routines || []
          
          // Process each routine
          for (const routine of routines) {
            try {
              await this.syncSingleRoutine(routine)
              result.synced++
              
              // Update progress
              await prisma.syncStatus.update({
                where: { id: syncStatus.id },
                data: { itemsSynced: result.synced }
              })
            } catch (error) {
              result.failed++
              result.errors.push({
                routineId: routine.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }

          // Check if there are more pages
          hasMore = routines.length === 20
          page++

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Error fetching routines page ${page}:`, error)
          hasMore = false
        }
      }

      // Update sync status to completed
      await prisma.syncStatus.update({
        where: { id: syncStatus.id },
        data: {
          status: result.failed === 0 ? 'completed' : 'completed_with_errors',
          completedAt: new Date(),
          itemsSynced: result.synced,
          totalItems: result.synced + result.failed,
          errorMessage: result.failed > 0 ? 
            `Failed to sync ${result.failed} routines` : null,
          metadata: result.errors.length > 0 ? result.errors : null
        }
      })

    } catch (error) {
      console.error('Routine sync failed:', error)
      throw error
    }

    return result
  }

  /**
   * Sync a single routine
   */
  private async syncSingleRoutine(routine: Routine): Promise<void> {
    // Get full routine details
    const fullRoutine = await hevyServerClient.get<Routine>(`/routines/${routine.id}`)

    // Upsert routine to database
    await prisma.importedRoutine.upsert({
      where: { hevyRoutineId: routine.id },
      update: {
        routineData: fullRoutine as any, // Store full routine data as JSON
        name: fullRoutine.name,
        folderId: fullRoutine.folder_id || null,
        isArchived: fullRoutine.is_archived || false,
        lastSyncedAt: new Date()
      },
      create: {
        userId: this.userId,
        hevyRoutineId: routine.id,
        routineData: fullRoutine as any,
        name: fullRoutine.name,
        folderId: fullRoutine.folder_id || null,
        isArchived: fullRoutine.is_archived || false
      }
    })
  }

  /**
   * Get sync status for routines
   */
  async getSyncStatus() {
    const latestSync = await prisma.syncStatus.findFirst({
      where: { 
        userId: this.userId,
        syncType: 'routines'
      },
      orderBy: { startedAt: 'desc' }
    })

    const routineCount = await prisma.importedRoutine.count({
      where: { userId: this.userId }
    })

    const lastRoutineSync = await prisma.importedRoutine.findFirst({
      where: { userId: this.userId },
      orderBy: { lastSyncedAt: 'desc' },
      select: { lastSyncedAt: true }
    })

    return {
      latestSync,
      totalRoutinesCached: routineCount,
      lastSyncedAt: lastRoutineSync?.lastSyncedAt
    }
  }
}