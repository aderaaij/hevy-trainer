import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '../lib/types';
import { hevyServerClient } from '../lib/hevy-server-client';
import { HevyRoutinesResponse, CreateRoutineRequest } from '@/lib/hevy/types/routines';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (pageSize) params.append('pageSize', pageSize);
    
    const queryString = params.toString();
    const url = queryString ? `/routines?${queryString}` : '/routines';
    
    const data = await hevyServerClient.get<HevyRoutinesResponse>(url);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch routines' },
      { status: apiError.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRoutineRequest = await request.json();
    const data = await hevyServerClient.post('/routines', body);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to create routine' },
      { status: apiError.status || 500 }
    );
  }
}