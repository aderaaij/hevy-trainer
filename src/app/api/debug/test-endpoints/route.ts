import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hevyServerClient } from '@/app/api/hevy/lib/hevy-server-client'

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

    const tests = []

    // Test 1: Try workouts endpoint (known to work)
    try {
      console.log('Testing workouts endpoint...')
      const workoutsResponse = await hevyServerClient.get('/workouts/count')
      tests.push({
        endpoint: '/workouts/count',
        status: 'success',
        data: workoutsResponse
      })
    } catch (error: any) {
      tests.push({
        endpoint: '/workouts/count',
        status: 'error',
        error: {
          message: error.message,
          status: error.status
        }
      })
    }

    // Test 2: Try routines endpoint
    try {
      console.log('Testing routines endpoint...')
      const routinesResponse = await hevyServerClient.get('/routines?page=1&pageSize=5')
      tests.push({
        endpoint: '/routines?page=1&pageSize=5',
        status: 'success',
        data: routinesResponse
      })
    } catch (error: any) {
      tests.push({
        endpoint: '/routines?page=1&pageSize=5',
        status: 'error',
        error: {
          message: error.message,
          status: error.status
        }
      })
    }

    // Test 3: Try routine folders endpoint (with correct underscore)
    try {
      console.log('Testing routine folders endpoint...')
      const foldersResponse = await hevyServerClient.get('/routine_folders?page=1&pageSize=5')
      tests.push({
        endpoint: '/routine_folders?page=1&pageSize=5',
        status: 'success',
        data: foldersResponse
      })
    } catch (error: any) {
      tests.push({
        endpoint: '/routine_folders?page=1&pageSize=5',
        status: 'error',
        error: {
          message: error.message,
          status: error.status
        }
      })
    }

    // Test 4: Try exercises endpoint (with correct underscore)
    try {
      console.log('Testing exercises endpoint...')
      const exercisesResponse = await hevyServerClient.get('/exercise_templates?page=1&pageSize=5')
      tests.push({
        endpoint: '/exercise_templates?page=1&pageSize=5',
        status: 'success',
        data: exercisesResponse
      })
    } catch (error: any) {
      tests.push({
        endpoint: '/exercise_templates?page=1&pageSize=5',
        status: 'error',
        error: {
          message: error.message,
          status: error.status
        }
      })
    }

    // Test 5: Try routines without pagination
    try {
      console.log('Testing routines endpoint without pagination...')
      const routinesResponse = await hevyServerClient.get('/routines')
      tests.push({
        endpoint: '/routines',
        status: 'success',
        data: routinesResponse
      })
    } catch (error: any) {
      tests.push({
        endpoint: '/routines',
        status: 'error',
        error: {
          message: error.message,
          status: error.status
        }
      })
    }

    return NextResponse.json({
      success: true,
      tests,
      summary: {
        total: tests.length,
        successful: tests.filter(t => t.status === 'success').length,
        failed: tests.filter(t => t.status === 'error').length
      }
    })

  } catch (error) {
    console.error('Test endpoints error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to test endpoints' },
      { status: 500 }
    )
  }
}