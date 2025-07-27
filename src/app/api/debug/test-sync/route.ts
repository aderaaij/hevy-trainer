import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WorkoutSyncService } from '@/lib/sync/workout-sync'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Clean up stuck sync statuses first
    await prisma.syncStatus.updateMany({
      where: { 
        userId: user.id,
        status: 'in_progress'
      },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: 'Sync was interrupted'
      }
    })

    console.log('Starting test sync...')
    
    // Create sync service and try to sync just a few workouts
    const syncService = new WorkoutSyncService(user.id)
    
    try {
      console.log('Calling syncAllWorkouts...')
      const result = await syncService.syncAllWorkouts()
      console.log('Sync result:', result)
      
      return NextResponse.json({
        success: true,
        result,
        message: 'Sync completed successfully'
      })
    } catch (syncError) {
      console.error('Sync error details:', syncError)
      return NextResponse.json({
        success: false,
        error: syncError instanceof Error ? syncError.message : 'Unknown sync error',
        errorDetails: syncError,
        stack: syncError instanceof Error ? syncError.stack : undefined
      })
    }

  } catch (error) {
    console.error('Test sync endpoint error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to test sync',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}