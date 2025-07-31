import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@/generated/prisma';
import { routineService } from '@/lib/hevy';
import { routineTransformer } from '@/lib/ai/routine-transformer';
import { AIGeneratedRoutine } from '@/lib/ai/routine-transformer';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request data
    const body = await request.json();
    const { routineId, routineIndex = 0 } = body;

    if (!routineId) {
      return NextResponse.json({ error: 'Routine ID is required' }, { status: 400 });
    }

    // Fetch the generated routine from database
    const generatedRoutine = await prisma.generatedRoutine.findUnique({
      where: { id: routineId }
    });

    if (!generatedRoutine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    if (generatedRoutine.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const routines = generatedRoutine.routineData as AIGeneratedRoutine[];
    
    if (!routines || routines.length === 0) {
      return NextResponse.json({ error: 'No routines found in generated data' }, { status: 400 });
    }

    if (routineIndex >= routines.length) {
      return NextResponse.json({ 
        error: `Invalid routine index. Only ${routines.length} routines available.` 
      }, { status: 400 });
    }

    const routineToExport = routines[routineIndex];

    // Transform to Hevy format
    const hevyRoutineRequest = routineTransformer.transformToHevyCreateRequest(routineToExport);

    // Create routine in Hevy
    const createdRoutine = await routineService.createRoutine(hevyRoutineRequest);

    if (!createdRoutine) {
      throw new Error('Failed to create routine in Hevy');
    }

    // Update database to mark as exported
    await prisma.generatedRoutine.update({
      where: { id: routineId },
      data: {
        exportedToHevy: true,
        hevyRoutineId: createdRoutine.id.toString(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      hevyRoutineId: createdRoutine.id,
      routineTitle: createdRoutine.title,
      message: 'Routine successfully exported to Hevy'
    });

  } catch (error) {
    console.error('Error exporting routine:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Export failed: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to export routine to Hevy' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to check export status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const routineId = searchParams.get('routineId');

    if (!routineId) {
      return NextResponse.json({ error: 'Routine ID is required' }, { status: 400 });
    }

    const generatedRoutine = await prisma.generatedRoutine.findUnique({
      where: { id: routineId },
      select: {
        id: true,
        exportedToHevy: true,
        hevyRoutineId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!generatedRoutine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    return NextResponse.json({
      routineId: generatedRoutine.id,
      exported: generatedRoutine.exportedToHevy,
      hevyRoutineId: generatedRoutine.hevyRoutineId,
      createdAt: generatedRoutine.createdAt,
      updatedAt: generatedRoutine.updatedAt
    });

  } catch (error) {
    console.error('Error checking export status:', error);
    return NextResponse.json(
      { error: 'Failed to check export status' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}