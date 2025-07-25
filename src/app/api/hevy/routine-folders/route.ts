import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '../lib/types';
import { hevyServerClient } from '../lib/hevy-server-client';
import { HevyRoutineFoldersResponse, CreateRoutineFolderRequest } from '@/lib/hevy/types/routine-folders';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (pageSize) params.append('pageSize', pageSize);
    
    const queryString = params.toString();
    const url = queryString ? `/routine_folders?${queryString}` : '/routine_folders';
    
    const data = await hevyServerClient.get<HevyRoutineFoldersResponse>(url);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch routine folders' },
      { status: apiError.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRoutineFolderRequest = await request.json();
    const data = await hevyServerClient.post('/routine_folders', body);
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || 'Failed to create routine folder' },
      { status: apiError.status || 500 }
    );
  }
}