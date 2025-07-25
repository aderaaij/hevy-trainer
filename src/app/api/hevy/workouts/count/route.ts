import { NextResponse } from 'next/server';
import { ApiError } from '../../lib/types';
import { hevyServerClient } from '../../lib/hevy-server-client';
import { WorkoutCountResponse } from '@/lib/hevy/types/workouts';

export async function GET() {
  try {
    const data = await hevyServerClient.get<WorkoutCountResponse>('/workouts/count');
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch workout count' },
      { status: apiError.status || 500 }
    );
  }
}