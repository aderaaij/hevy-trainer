import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '../../lib/types';
import { hevyServerClient } from '../../lib/hevy-server-client';
import { HevyWorkoutEventsResponse } from '@/lib/hevy/types/workouts';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    const since = searchParams.get('since');
    
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (pageSize) params.append('pageSize', pageSize);
    if (since) params.append('since', since);
    
    const queryString = params.toString();
    const url = queryString ? `/workouts/events?${queryString}` : '/workouts/events';
    
    const data = await hevyServerClient.get<HevyWorkoutEventsResponse>(url);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch workout events' },
      { status: apiError.status || 500 }
    );
  }
}