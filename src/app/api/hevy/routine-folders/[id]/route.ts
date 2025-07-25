import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '../../lib/types';
import { hevyServerClient } from '../../lib/hevy-server-client';
import { RoutineFolder } from '@/lib/hevy/types/routine-folders';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await hevyServerClient.get<RoutineFolder>(`/routine_folders/${id}`);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch routine folder' },
      { status: apiError.status || 500 }
    );
  }
}