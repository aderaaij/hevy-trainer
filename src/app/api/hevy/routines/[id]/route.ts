import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '../../lib/types';
import { hevyServerClient } from '../../lib/hevy-server-client';
import { Routine, UpdateRoutineRequest } from '@/lib/hevy/types/routines';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await hevyServerClient.get<Routine>(`/routines/${id}`);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch routine' },
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
    const body: UpdateRoutineRequest = await request.json();
    const data = await hevyServerClient.put<Routine>(`/routines/${id}`, body);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to update routine' },
      { status: apiError.status || 500 }
    );
  }
}