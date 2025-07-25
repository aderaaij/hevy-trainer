import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '../../lib/types';
import { hevyServerClient } from '../../lib/hevy-server-client';
import { Workout, UpdateWorkoutRequest } from '@/lib/hevy/types/workouts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await hevyServerClient.get<Workout>(`/workouts/${id}`);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch workout' },
      { status: apiError.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body: UpdateWorkoutRequest = await request.json();
    const data = await hevyServerClient.put<Workout>(`/workouts/${id}`, body);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to update workout' },
      { status: apiError.status || 500 }
    );
  }
}