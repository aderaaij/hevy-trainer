import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Test environment variables
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    
    // Test auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      success: true,
      environment: {
        hasOpenAIKey,
        nodeEnv: process.env.NODE_ENV
      },
      auth: {
        hasUser: !!user,
        authError: authError?.message || null,
        userId: user?.id || null
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test basic request handling
    return NextResponse.json({
      success: true,
      receivedData: body,
      message: 'POST endpoint working'
    });
  } catch (error) {
    console.error('Test POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}