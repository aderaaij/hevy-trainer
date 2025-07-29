import { PrismaClient } from '@/generated/prisma'
import { hevyServerClient } from '@/app/api/hevy/lib/hevy-server-client'
import { ExerciseTemplate, HevyExerciseTemplatesResponse } from '@/lib/hevy/types/exercise-templates'

const prisma = new PrismaClient()

interface SyncResult {
  synced: number
  failed: number
  errors: Array<{ exerciseId: string; error: string }>
}

export class ExerciseSyncService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Sync all exercise templates for a user (incremental - only missing/updated)
   */
  async syncAllExercises(): Promise<SyncResult> {
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
          syncType: 'exercises',
          status: 'in_progress',
        }
      })

      // Get existing exercise IDs from database
      const existingExercises = await prisma.importedExerciseTemplate.findMany({
        where: { userId: this.userId },
        select: { hevyExerciseId: true }
      })
      const existingExerciseIds = new Set(existingExercises.map(e => e.hevyExerciseId))

      // Fetch all exercise templates (API handles pagination automatically)
      let page = 1

      // Try to get first response to determine pagination
      let totalPages = 1
      
      while (page <= totalPages) {
        try {
          
          // Use the API's built-in pagination - don't specify page size
          const url = page === 1 ? '/exercise_templates' : `/exercise_templates?page=${page}`
          const exercisesResponse = await hevyServerClient.get<HevyExerciseTemplatesResponse>(url)

          // Update total pages from first response
          if (page === 1) {
            totalPages = exercisesResponse.page_count || 1
          }

          const exercises = exercisesResponse.exercise_templates || []
          
          // Process each exercise template, but only sync if not already cached
          for (const exercise of exercises) {
            // Skip if exercise already exists
            if (existingExerciseIds.has(exercise.id)) {
              continue
            }

            try {
              await this.syncSingleExercise(exercise)
              result.synced++
              
              // Update progress
              await prisma.syncStatus.update({
                where: { id: syncStatus.id },
                data: { itemsSynced: result.synced }
              })
            } catch (error) {
              result.failed++
              result.errors.push({
                exerciseId: exercise.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }

          page++

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Error fetching exercises page ${page}:`, error)
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
            `Failed to sync ${result.failed} exercises` : null,
          metadata: result.errors.length > 0 ? result.errors : null
        }
      })

    } catch (error) {
      console.error('Exercise sync failed:', error)
      throw error
    }

    return result
  }

  /**
   * Sync a single exercise template
   */
  private async syncSingleExercise(exercise: ExerciseTemplate): Promise<void> {
    // Get full exercise details if needed
    let fullExercise = exercise
    
    // If we need more details, fetch them
    if (!exercise.primary_muscle_group) {
      try {
        fullExercise = await hevyServerClient.get<ExerciseTemplate>(`/exercise_templates/${exercise.id}`)
      } catch {
        // If fetching full details fails, use what we have
      }
    }

    // Upsert exercise template to database
    await prisma.importedExerciseTemplate.upsert({
      where: { hevyExerciseId: exercise.id },
      update: {
        exerciseTemplateData: fullExercise,
        name: fullExercise.title,
        muscleGroup: fullExercise.primary_muscle_group || null,
        exerciseType: fullExercise.equipment || 'other',
        isCustom: fullExercise.is_custom || false,
        lastSyncedAt: new Date()
      },
      create: {
        userId: this.userId,
        hevyExerciseId: exercise.id,
        exerciseTemplateData: fullExercise,
        name: fullExercise.title,
        muscleGroup: fullExercise.primary_muscle_group || null,
        exerciseType: fullExercise.equipment || 'other',
        isCustom: fullExercise.is_custom || false
      }
    })
  }

  /**
   * Get sync status for exercises
   */
  async getSyncStatus() {
    const latestSync = await prisma.syncStatus.findFirst({
      where: { 
        userId: this.userId,
        syncType: 'exercises'
      },
      orderBy: { startedAt: 'desc' }
    })

    const exerciseCount = await prisma.importedExerciseTemplate.count({
      where: { userId: this.userId }
    })

    const lastExerciseSync = await prisma.importedExerciseTemplate.findFirst({
      where: { userId: this.userId },
      orderBy: { lastSyncedAt: 'desc' },
      select: { lastSyncedAt: true }
    })

    return {
      latestSync,
      totalExercisesCached: exerciseCount,
      lastSyncedAt: lastExerciseSync?.lastSyncedAt
    }
  }
}