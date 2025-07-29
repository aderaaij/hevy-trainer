import { PrismaClient } from '@/generated/prisma'
import { hevyServerClient } from '@/app/api/hevy/lib/hevy-server-client'
import { RoutineFolder, HevyRoutineFoldersResponse } from '@/lib/hevy/types/routine-folders'

const prisma = new PrismaClient()

interface SyncResult {
  synced: number
  failed: number
  errors: Array<{ folderId: string; error: string }>
}

export class RoutineFolderSyncService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Sync all routine folders for a user (incremental - only missing/updated)
   */
  async syncAllRoutineFolders(): Promise<SyncResult> {
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
          syncType: 'routine_folders',
          status: 'in_progress',
        }
      })

      // Get existing folder IDs from database
      const existingFolders = await prisma.importedRoutineFolder.findMany({
        where: { userId: this.userId },
        select: { hevyFolderId: true }
      })
      const existingFolderIds = new Set(existingFolders.map(f => f.hevyFolderId))

      // Fetch all routine folders (API handles pagination automatically)
      let page = 1

      // Try to get first response to determine pagination
      let totalPages = 1
      
      while (page <= totalPages) {
        try {
          
          // Use the API's built-in pagination - don't specify page size
          const url = page === 1 ? '/routine_folders' : `/routine_folders?page=${page}`
          const foldersResponse = await hevyServerClient.get<HevyRoutineFoldersResponse>(url)

          // Update total pages from first response
          if (page === 1) {
            totalPages = foldersResponse.page_count || 1
          }

          const folders = foldersResponse.routine_folders || []
          
          // Process each folder, but only sync if not already cached
          for (const folder of folders) {
            // Skip if folder already exists
            if (existingFolderIds.has(String(folder.id))) {
              continue
            }

            try {
              await this.syncSingleFolder(folder)
              result.synced++
              
              // Update progress
              await prisma.syncStatus.update({
                where: { id: syncStatus.id },
                data: { itemsSynced: result.synced }
              })
            } catch (error) {
              console.error(`Failed to sync folder ${folder.id}:`, error?.message || error)
              result.failed++
              result.errors.push({
                folderId: folder.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }

          page++

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Error fetching routine folders page ${page}:`, error)
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
            `Failed to sync ${result.failed} folders` : null,
          metadata: result.errors.length > 0 ? result.errors : null
        }
      })

    } catch (error) {
      console.error('Routine folder sync failed:', error)
      throw error
    }

    return result
  }

  /**
   * Sync a single routine folder
   */
  private async syncSingleFolder(folder: RoutineFolder): Promise<void> {
    // Get full folder details
    const fullFolder = await hevyServerClient.get<RoutineFolder>(`/routine_folders/${folder.id}`)

    // Upsert folder to database
    await prisma.importedRoutineFolder.upsert({
      where: { hevyFolderId: String(folder.id) },
      update: {
        folderData: fullFolder, // Store full folder data as JSON
        name: fullFolder.title || fullFolder.name,
        lastSyncedAt: new Date()
      },
      create: {
        userId: this.userId,
        hevyFolderId: String(folder.id),
        folderData: fullFolder,
        name: fullFolder.title || fullFolder.name
      }
    })
  }

  /**
   * Get sync status for routine folders
   */
  async getSyncStatus() {
    const latestSync = await prisma.syncStatus.findFirst({
      where: { 
        userId: this.userId,
        syncType: 'routine_folders'
      },
      orderBy: { startedAt: 'desc' }
    })

    const folderCount = await prisma.importedRoutineFolder.count({
      where: { userId: this.userId }
    })

    const lastFolderSync = await prisma.importedRoutineFolder.findFirst({
      where: { userId: this.userId },
      orderBy: { lastSyncedAt: 'desc' },
      select: { lastSyncedAt: true }
    })

    return {
      latestSync,
      totalFoldersCached: folderCount,
      lastSyncedAt: lastFolderSync?.lastSyncedAt
    }
  }
}