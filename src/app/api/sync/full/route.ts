import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HevySyncService } from '@/lib/sync/sync-service'

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

    // Create sync service
    const syncService = new HevySyncService(user.id)

    // Check if sync is already in progress
    if (await syncService.isSyncInProgress()) {
      return NextResponse.json(
        { error: 'Sync already in progress' },
        { status: 409 }
      )
    }

    // Start full sync in background (don't await)
    // In production, you'd want to use a queue system like BullMQ
    syncService.fullSync().catch(error => {
      console.error('Background sync failed:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'Full sync started in background'
    })

  } catch (error) {
    console.error('Full sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start sync' },
      { status: 500 }
    )
  }
}