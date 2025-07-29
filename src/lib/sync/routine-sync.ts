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
   * Sync all routines for a user (incremental - only missing/updated)
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

      // Get existing routine IDs from database
      const existingRoutines = await prisma.importedRoutine.findMany({
        where: { userId: this.userId },
        select: { hevyRoutineId: true }
      })
      const existingRoutineIds = new Set(existingRoutines.map(r => r.hevyRoutineId))

      // Fetch all routines (API handles pagination automatically)
      let page = 1

      // Try to get first response to determine pagination
      let totalPages = 1
      
      while (page <= totalPages) {
        try {
          
          // Use the API's built-in pagination - don't specify page size
          const url = page === 1 ? '/routines' : `/routines?page=${page}`
          const routinesResponse = await hevyServerClient.get<RoutinesResponse>(url)

          // Update total pages from first response
          if (page === 1) {
            totalPages = routinesResponse.page_count || 1
          }

          const routines = routinesResponse.routines || []
          
          // Process each routine, but only sync if not already cached
          for (const routine of routines) {
            // Skip if routine already exists
            if (existingRoutineIds.has(String(routine.id))) {
              continue
            }

            try {
              await this.syncSingleRoutine(routine)
              result.synced++
              
              // Update progress
              await prisma.syncStatus.update({
                where: { id: syncStatus.id },
                data: { itemsSynced: result.synced }
              })
            } catch (error) {
              console.error(`Failed to sync routine ${routine.id}:`, error)
              result.failed++
              result.errors.push({
                routineId: routine.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }

          page++

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Error fetching routines page ${page}:`, error)
          break
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
    try {
      // Get full routine details
      const fullRoutine = await hevyServerClient.get<Routine>(`/routines/${routine.id}`)
      

      // Check if the folder exists if folderId is provided
      let folderId = null
      if (fullRoutine.folder_id) {
        const folderIdString = String(fullRoutine.folder_id)
        const folderExists = await prisma.importedRoutineFolder.findUnique({
          where: { hevyFolderId: folderIdString }
        })
        
        if (folderExists) {
          folderId = folderIdString
        } else {
        }
      }

      // Prepare the data with proper defaults
      const routineData = {
        userId: this.userId,
        hevyRoutineId: String(routine.id),
        routineData: fullRoutine,
        name: fullRoutine.title || fullRoutine.name || 'Untitled Routine',
        folderId,
        isArchived: Boolean(fullRoutine.is_archived)
      }


      // Upsert routine to database
      try {
        await prisma.importedRoutine.upsert({
          where: { hevyRoutineId: String(routine.id) },
          update: {
            routineData: routineData.routineData,
            name: routineData.name,
            folderId: routineData.folderId,
            isArchived: routineData.isArchived,
            lastSyncedAt: new Date()
          },
          create: routineData
        })
      } catch (prismaError) {
        console.error(`Failed to upsert routine ${routine.id}:`, prismaError?.message || prismaError)
        throw prismaError
      }
      
    } catch (error) {
      console.error(`Error syncing routine ${routine.id}:`, error?.message || error)
      throw error
    }
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