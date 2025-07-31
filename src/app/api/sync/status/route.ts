import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HevySyncService } from '@/lib/sync/sync-service'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

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
      // If no API key configured, just return basic status without recommendations
      const recentSyncs = await prisma.syncStatus.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' },
        take: 5
      })

      const counts = await prisma.$transaction([
        prisma.importedWorkout.count({ where: { userId: user.id } }),
        prisma.importedRoutine.count({ where: { userId: user.id } }),
        prisma.importedExerciseTemplate.count({ where: { userId: user.id } })
      ])

      return NextResponse.json({
        recentSyncs,
        counts: {
          workouts: counts[0],
          routines: counts[1],
          exercises: counts[2]
        },
        apiKeyConfigured: false
      })
    }

    // Get comprehensive sync status
    const syncService = new HevySyncService(user.id)
    const status = await syncService.getOverallSyncStatus()

    // Get recent sync history
    const recentSyncs = await prisma.syncStatus.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      ...status,
      recentSyncs
    })

  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get sync status' },
      { status: 500 }
    )
  }
}