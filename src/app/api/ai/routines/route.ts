import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all routines for the user
    const routines = await prisma.generatedRoutine.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        routineData: true,
        aiContext: true,
        exportedToHevy: true,
        hevyRoutineId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Transform the data for the frontend
    const transformedRoutines = routines.map(routine => {
      const routineData = routine.routineData as Array<{
        title?: string;
        notes?: string;
        exercises?: unknown[];
      }>;
      const aiContext = routine.aiContext as {
        duration?: number;
        progressionType?: string;
        focusArea?: string | null;
      } | null;
      
      return {
        id: routine.id,
        createdAt: routine.createdAt,
        updatedAt: routine.updatedAt,
        exportedToHevy: routine.exportedToHevy,
        metadata: {
          duration: aiContext?.duration || 4,
          progressionType: aiContext?.progressionType || 'linear',
          focusArea: aiContext?.focusArea || null,
          routineCount: routineData.length
        },
        firstRoutine: routineData[0] || {
          title: 'Untitled Routine',
          notes: '',
          exercises: []
        }
      };
    });

    return NextResponse.json({
      routines: transformedRoutines,
      total: transformedRoutines.length
    });

  } catch (error) {
    console.error('Error fetching routines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routines' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}