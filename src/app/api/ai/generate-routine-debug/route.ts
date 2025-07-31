import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Starting generate routine debug ===');
    
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Auth check:', { hasUser: !!user, authError });

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request data
    const body = await request.json();
    console.log('Request body:', body);

    // Check user profile exists
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id }
    });
    
    console.log('User profile:', { exists: !!userProfile, id: userProfile?.id });

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found. Please complete your profile first.' }, { status: 404 });
    }

    // Check for available exercises
    const exerciseCount = await prisma.importedExerciseTemplate.count({
      where: { userId: user.id }
    });

    console.log('Exercise count:', exerciseCount);

    if (exerciseCount === 0) {
      return NextResponse.json({ 
        error: 'No exercises found. Please sync your exercises from Hevy first.' 
      }, { status: 400 });
    }

    // For now, just return success without calling OpenAI
    return NextResponse.json({
      success: true,
      debug: true,
      message: 'Debug endpoint working',
      userProfile: {
        id: userProfile.id,
        experienceLevel: userProfile.experienceLevel,
        focusAreas: userProfile.focusAreas
      },
      exerciseCount
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: true
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}