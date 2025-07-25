import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '../../lib/types';
import { hevyServerClient } from '../../lib/hevy-server-client';
import { ExerciseTemplate } from '@/lib/hevy/types/exercise-templates';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await hevyServerClient.get<ExerciseTemplate>(`/exercise_templates/${id}`);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch exercise template' },
      { status: apiError.status || 500 }
    );
  }
}