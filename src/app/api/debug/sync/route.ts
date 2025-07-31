import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrismaClient } from '@/generated/prisma'
import { hevyServerClient } from '@/app/api/hevy/lib/hevy-server-client'

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

    // Test 1: Check if API key is configured
    const apiKeyConfigured = !!process.env.HEVY_API_KEY
    console.log('API Key configured:', apiKeyConfigured)

    // Test 2: Check database counts
    const [syncStatuses, workouts, routines, exercises] = await prisma.$transaction([
      prisma.syncStatus.count({ where: { userId: user.id } }),
      prisma.importedWorkout.count({ where: { userId: user.id } }),
      prisma.importedRoutine.count({ where: { userId: user.id } }),
      prisma.importedExerciseTemplate.count({ where: { userId: user.id } })
    ])

    // Test 3: Get latest sync status
    const latestSync = await prisma.syncStatus.findFirst({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' }
    })

    // Test 4: Try to call Hevy API directly
    let hevyApiTest = null
    let hevyApiError = null
    if (apiKeyConfigured) {
      try {
        console.log('Testing Hevy API connection...')
        const countResponse = await hevyServerClient.get('/workouts/count')
        hevyApiTest = countResponse
        console.log('Hevy API response:', countResponse)
      } catch (error) {
        hevyApiError = error
        console.error('Hevy API error:', error)
      }
    }

    return NextResponse.json({
      apiKeyConfigured,
      databaseCounts: {
        syncStatuses,
        workouts,
        routines,
        exercises
      },
      latestSync,
      hevyApiTest,
      hevyApiError: hevyApiError ? {
        message: hevyApiError.message || 'Unknown error',
        status: hevyApiError.status,
        details: hevyApiError
      } : null
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to debug' },
      { status: 500 }
    )
  }
}