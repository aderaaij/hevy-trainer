import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RoutineFolderSyncService } from '@/lib/sync/routine-folder-sync'

export async function POST(_request: NextRequest) {
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

    // Create routine folder sync service
    const folderSync = new RoutineFolderSyncService(user.id)

    // Start routine folder sync
    const result = await folderSync.syncAllRoutineFolders()

    return NextResponse.json({
      success: true,
      message: 'Routine folder sync completed',
      result: {
        synced: result.synced,
        failed: result.failed,
        errors: result.errors
      }
    })

  } catch (error) {
    console.error('Routine folder sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync routine folders' },
      { status: 500 }
    )
  }
}