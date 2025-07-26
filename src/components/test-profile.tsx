"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, AlertCircle } from "lucide-react"

interface UserProfile {
  id: string
  userId: string
  age: number | null
  weight: number | null
  trainingFrequency: number | null
  experienceLevel: string | null
  focusAreas: string[]
  injuries: string[]
  createdAt: string
  updatedAt: string
}

export function TestProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const supabase = createClient()

  async function loadProfile() {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        return
      }

      console.log('Current user:', user.id)

      const response = await fetch('/api/auth/profile')
      console.log('Profile response status:', response.status)
      
      if (response.ok) {
        const profileData = await response.json()
        console.log('Profile data:', profileData)
        setProfile(profileData)
      } else if (response.status === 404) {
        setError('Profile not found - you may need to create one')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load profile')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Network error loading profile')
    } finally {
      setIsLoading(false)
    }
  }

  async function createProfile() {
    try {
      setIsCreating(true)
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        return
      }

      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          age: 25,
          weight: 70,
          trainingFrequency: 3,
          experienceLevel: 'beginner',
          focusAreas: ['strength'],
          injuries: [],
        }),
      })

      if (response.ok) {
        const profileData = await response.json()
        console.log('Created profile:', profileData)
        setProfile(profileData)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create profile')
      }
    } catch (error) {
      console.error('Error creating profile:', error)
      setError('Network error creating profile')
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Debug Tool
        </CardTitle>
        <CardDescription>
          Test profile loading and creation functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={loadProfile} disabled={isLoading} variant="outline">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Reload Profile
          </Button>
          
          <Button onClick={createProfile} disabled={isCreating}>
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Test Profile
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading profile...</span>
          </div>
        ) : profile ? (
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600">Profile Found!</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm">
              <pre>{JSON.stringify(profile, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No profile found. Try creating one with the button above.
          </div>
        )}
      </CardContent>
    </Card>
  )
}