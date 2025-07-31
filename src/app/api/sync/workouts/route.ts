import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WorkoutSyncService } from '@/lib/sync/workout-sync'

export async function POST(request: NextRequest) {
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

    // Get sync type from request body
    const body = await request.json()
    const { syncType = 'full' } = body // 'full' or 'incremental'

    // Verify Hevy API key is configured
    if (!process.env.HEVY_API_KEY) {
      return NextResponse.json(
        { error: 'Hevy API key not configured in environment variables' },
        { status: 500 }
      )
    }

    // Create sync service
    const syncService = new WorkoutSyncService(user.id)

    // Check if sync is already in progress
    const { HevySyncService } = await import('@/lib/sync/sync-service')
    const mainSync = new HevySyncService(user.id)
    
    if (await mainSync.isSyncInProgress()) {
      return NextResponse.json(
        { error: 'Sync already in progress' },
        { status: 409 }
      )
    }

    // Perform sync based on type
    let result
    if (syncType === 'incremental') {
      result = await syncService.syncIncrementalWorkouts()
    } else {
      result = await syncService.syncAllWorkouts()
    }

    return NextResponse.json({
      success: true,
      syncType,
      result
    })

  } catch (error) {
    console.error('Workout sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync workouts' },
      { status: 500 }
    )
  }
}

export async function GET() {
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

    // Get Hevy API key from environment variables
    const hevyAuthToken = process.env.HEVY_API_KEY
    
    if (!hevyAuthToken) {
      return NextResponse.json(
        { error: 'Hevy API key not configured in environment variables' },
        { status: 500 }
      )
    }

    // Get sync status
    const syncService = new WorkoutSyncService(user.id)
    const status = await syncService.getSyncStatus()

    return NextResponse.json(status)

  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get sync status' },
      { status: 500 }
    )
  }
}