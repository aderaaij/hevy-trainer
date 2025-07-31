import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the routine
    const routine = await prisma.generatedRoutine.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        routineData: true,
        aiContext: true,
        exportedToHevy: true,
        hevyRoutineId: true,
        createdAt: true,
        updatedAt: true,
        userId: true
      }
    });

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    // Check if user owns this routine
    if (routine.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Extract metadata from aiContext
    const aiContext = routine.aiContext as {
      duration?: number;
      progressionType?: string;
      focusArea?: string | null;
      reasoning?: string;
      periodizationNotes?: string;
      trainingContext?: {
        availableExercises?: {
          total?: number;
        };
      };
    };
    const metadata = {
      duration: aiContext?.duration || 4,
      progressionType: aiContext?.progressionType || 'linear',
      focusArea: aiContext?.focusArea || null,
      exerciseCount: aiContext?.trainingContext?.availableExercises?.total || 0
    };

    return NextResponse.json({
      id: routine.id,
      routines: routine.routineData,
      reasoning: aiContext?.reasoning || '',
      periodizationNotes: aiContext?.periodizationNotes || '',
      metadata,
      createdAt: routine.createdAt,
      updatedAt: routine.updatedAt,
      exportedToHevy: routine.exportedToHevy,
      hevyRoutineId: routine.hevyRoutineId
    });

  } catch (error) {
    console.error('Error fetching routine:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routine' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}