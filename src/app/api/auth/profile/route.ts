import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

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

    const body = await request.json()
    const { userId, age, birthDate, weight, trainingFrequency, experienceLevel, focusAreas, injuries, injuryDetails, otherActivities } = body

    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create user profile (or update if exists)
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        age,
        birthDate: birthDate ? new Date(birthDate) : null,
        weight,
        trainingFrequency,
        experienceLevel,
        focusAreas: focusAreas || [],
        injuries: injuries || [],
        injuryDetails,
        otherActivities,
      },
      create: {
        userId,
        age,
        birthDate: birthDate ? new Date(birthDate) : null,
        weight,
        trainingFrequency,
        experienceLevel,
        focusAreas: focusAreas || [],
        injuries: injuries || [],
        injuryDetails,
        otherActivities,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create profile' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { age, birthDate, weight, trainingFrequency, experienceLevel, focusAreas, injuries, injuryDetails, otherActivities } = body

    // Update or create user profile
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        age,
        birthDate: birthDate ? new Date(birthDate) : null,
        weight,
        trainingFrequency,
        experienceLevel,
        focusAreas: focusAreas || [],
        injuries: injuries || [],
        injuryDetails,
        otherActivities,
      },
      create: {
        userId: user.id,
        age,
        birthDate: birthDate ? new Date(birthDate) : null,
        weight,
        trainingFrequency,
        experienceLevel,
        focusAreas: focusAreas || [],
        injuries: injuries || [],
        injuryDetails,
        otherActivities,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 500 }
    )
  }
}