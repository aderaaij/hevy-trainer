import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ExerciseSyncService } from '@/lib/sync/exercise-sync'

export async function POST() {
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

    // Verify Hevy API key is configured
    if (!process.env.HEVY_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Hevy API key not configured',
        message: 'Server configuration error: Hevy API key not found in environment variables.'
      }, { status: 500 })
    }

    // Create exercise sync service
    const exerciseSync = new ExerciseSyncService(user.id)

    // Start exercise sync
    const result = await exerciseSync.syncAllExercises()

    return NextResponse.json({
      success: true,
      message: 'Exercise sync completed',
      result: {
        synced: result.synced,
        failed: result.failed,
        errors: result.errors
      }
    })

  } catch (error) {
    console.error('Exercise sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync exercises' },
      { status: 500 }
    )
  }
}