import type { User } from '@supabase/supabase-js'

export interface AuthUser extends Omit<User, 'user_metadata'> {
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
}

export interface SignUpData {
  email: string
  password: string
  fullName?: string
  // Profile data
  age?: number
  weight?: number
  trainingFrequency?: number
  focusAreas?: string[]
  injuries?: string[]
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
}