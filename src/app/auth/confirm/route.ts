import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email_change' | 'recovery' | 'invite',
      token_hash,
    })

    if (!error) {
      // Get the user after confirmation
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Create user profile if it doesn't exist
        try {
          const response = await fetch(`${request.nextUrl.origin}/api/auth/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              age: null,
              weight: null,
              trainingFrequency: 3,
              experienceLevel: null,
              focusAreas: [],
              injuries: [],
            }),
          })
          
          if (!response.ok && response.status !== 409) {
            console.error('Failed to create profile after confirmation')
          }
        } catch (error) {
          console.error('Error creating profile:', error)
        }
      }
      
      // Redirect to dashboard
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/auth/auth-error', request.url))
}