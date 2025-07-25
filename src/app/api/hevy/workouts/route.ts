import { NextRequest, NextResponse } from 'next/server';
import { hevyServerClient } from '../lib/hevy-server-client';
import { HevyWorkoutsResponse, CreateWorkoutRequest } from '@/lib/hevy/types/workouts';
import { ApiError } from '../lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (pageSize) params.append('pageSize', pageSize);
    
    const queryString = params.toString();
    const url = queryString ? `/workouts?${queryString}` : '/workouts';
    
    const data = await hevyServerClient.get<HevyWorkoutsResponse>(url);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch workouts' },
      { status: apiError.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateWorkoutRequest = await request.json();
    const data = await hevyServerClient.post('/workouts', body);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to create workout' },
      { status: apiError.status || 500 }
    );
  }
}