"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { FOCUS_AREAS, COMMON_INJURIES } from "@/lib/constants/profile"
import { calculateAge, formatDateForInput, isValidBirthDate, getMinBirthDateObject, getMaxBirthDateObject } from "@/lib/utils/age"
import { DatePicker } from "@/components/ui/date-picker"

const profileSchema = z.object({
  birthDate: z.date().refine((date) => {
    if (!date) return true // Optional field
    const age = calculateAge(date)
    return age >= 13 && age <= 120
  }, "Must be between 13 and 120 years old").optional(),
  weight: z.number().min(20, "Invalid weight").max(300, "Invalid weight").optional(),
  trainingFrequency: z.number().min(1, "Must train at least once a week").max(7, "Max 7 days per week").optional(),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  focusAreas: z.array(z.enum(FOCUS_AREAS)).optional(),
  injuries: z.array(z.enum(COMMON_INJURIES)).optional(),
  injuryDetails: z.string().max(1000, "Injury details must be less than 1000 characters").optional(),
  otherActivities: z.string().max(500, "Other activities must be less than 500 characters").optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface UserProfile {
  id: string
  userId: string
  age: number | null
  birthDate: string | null
  weight: number | null
  trainingFrequency: number | null
  experienceLevel: string | null
  focusAreas: string[]
  injuries: string[]
  injuryDetails: string | null
  otherActivities: string | null
  createdAt: string
  updatedAt: string
}

export function ProfileForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [hasExistingProfile, setHasExistingProfile] = useState(false)
  const supabase = createClient()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      birthDate: undefined,
      weight: undefined,
      trainingFrequency: 3,
      experienceLevel: undefined,
      focusAreas: [],
      injuries: [],
      injuryDetails: undefined,
      otherActivities: undefined,
    },
  })

  // Load existing profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const response = await fetch('/api/auth/profile')
        if (response.ok) {
          const profile: UserProfile = await response.json()
          setHasExistingProfile(true)
          
          // Update form with existing data
          form.reset({
            birthDate: profile.birthDate ? new Date(profile.birthDate) : undefined,
            weight: profile.weight || undefined,
            trainingFrequency: profile.trainingFrequency || 3,
            experienceLevel: (profile.experienceLevel as "beginner" | "intermediate" | "advanced") || undefined,
            focusAreas: profile.focusAreas as typeof FOCUS_AREAS[number][],
            injuries: profile.injuries as typeof COMMON_INJURIES[number][],
            injuryDetails: profile.injuryDetails || undefined,
            otherActivities: profile.otherActivities || undefined,
          })
        } else if (response.status === 404) {
          // Profile doesn't exist yet - form will stay with default values
          setHasExistingProfile(false)
          console.log('No profile found - user can create one')
        } else {
          console.error('Error loading profile:', response.status)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
  }, [form, router, supabase.auth])

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Calculate age from birth date and prepare data for API
      const submitData = {
        ...data,
        age: data.birthDate ? calculateAge(data.birthDate) : undefined,
        birthDate: data.birthDate ? data.birthDate.toISOString() : undefined,
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      setSuccess(true)
      setHasExistingProfile(true) // Profile now exists after successful save
      setTimeout(() => setSuccess(false), 3000) // Hide success message after 3 seconds
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while updating your profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your personal information and training preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Profile updated successfully!</AlertDescription>
              </Alert>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select birth date"
                          fromDate={getMinBirthDateObject()}
                          toDate={getMaxBirthDateObject()}
                        />
                      </FormControl>
                      <FormDescription>
                        We calculate your age from your birth date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="70.5"
                          {...field} 
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Training Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Training Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trainingFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Days per Week</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="7" 
                          {...field} 
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        How many days per week do you typically train?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                          <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                          <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Other Activities */}
              <FormField
                control={form.control}
                name="otherActivities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Sports & Activities</FormLabel>
                    <FormDescription>
                      List any other sports or physical activities you do regularly, including frequency and intensity.
                    </FormDescription>
                    <FormControl>
                      <Textarea 
                        placeholder="E.g., Running 3x per week (5-10km), Swimming 2x per week, Yoga daily, Basketball on weekends, Rock climbing once a week"
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Focus Areas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Training Focus</h3>
              
              <FormField
                control={form.control}
                name="focusAreas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Focus Areas</FormLabel>
                    <FormDescription>
                      Select the areas you want to focus on in your training (hold Ctrl/Cmd to select multiple)
                    </FormDescription>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2">
                        {FOCUS_AREAS.map((area) => (
                          <label key={area} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.value?.includes(area) || false}
                              onChange={(e) => {
                                const currentValues = field.value || []
                                if (e.target.checked) {
                                  field.onChange([...currentValues, area])
                                } else {
                                  field.onChange(currentValues.filter(v => v !== area))
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm capitalize">
                              {area.replace('_', ' ')}
                            </span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Injuries */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Health Information</h3>
              
              <FormField
                control={form.control}
                name="injuries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Injuries or Limitations</FormLabel>
                    <FormDescription>
                      Select any areas where you have current injuries or limitations
                    </FormDescription>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2">
                        {COMMON_INJURIES.map((injury) => (
                          <label key={injury} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.value?.includes(injury) || false}
                              onChange={(e) => {
                                const currentValues = field.value || []
                                if (e.target.checked) {
                                  field.onChange([...currentValues, injury])
                                } else {
                                  field.onChange(currentValues.filter(v => v !== injury))
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm capitalize">
                              {injury.replace('_', ' ')}
                            </span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Injury Details */}
            <FormField
              control={form.control}
              name="injuryDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Injury Details (Optional)</FormLabel>
                  <FormDescription>
                    Provide specific details about your injuries or limitations. Include which side (left/right), severity, restrictions, and how much this should factor into your workout recommendations.
                  </FormDescription>
                  <FormControl>
                    <Textarea 
                      placeholder="E.g., Left knee meniscus tear - avoid deep squats and high impact. Right shoulder impingement - limit overhead pressing. Please modify exercises significantly to work around these limitations."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {hasExistingProfile ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                hasExistingProfile ? 'Update Profile' : 'Create Profile'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}