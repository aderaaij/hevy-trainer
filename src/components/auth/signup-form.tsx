"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { AlertCircle } from "lucide-react"
import { FOCUS_AREAS, COMMON_INJURIES } from "@/lib/constants/profile"
import { calculateAge, getMinBirthDateObject, getMaxBirthDateObject } from "@/lib/utils/age"
import { DatePicker } from "@/components/ui/date-picker"

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      trainingFrequency: 3,
      focusAreas: [],
      injuries: [],
    },
  })

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Check if email confirmation is required
        if (authData.user.email_confirmed_at) {
          // User is confirmed, create profile and redirect
          const response = await fetch("/api/auth/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: authData.user.id,
              age: data.birthDate ? calculateAge(data.birthDate) : undefined,
              birthDate: data.birthDate ? data.birthDate.toISOString() : undefined,
              weight: data.weight,
              trainingFrequency: data.trainingFrequency,
              experienceLevel: data.experienceLevel,
              focusAreas: data.focusAreas || [],
              injuries: data.injuries || [],
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to create user profile")
          }

          router.push("/dashboard")
        } else {
          // Email confirmation required - redirect to check email page
          router.push("/auth/check-email")
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred during signup")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormDescription>
                Must be at least 8 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium">Training Profile (Optional)</h3>
          
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
                <FormControl>
                  <select 
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-950 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:file:text-neutral-50 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                    {...field}
                  >
                    <option value="">Select level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Focus Areas */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium">Training Focus (Optional)</h3>
          
          <FormField
            control={form.control}
            name="focusAreas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Focus Areas</FormLabel>
                <FormDescription>
                  Select the areas you want to focus on in your training
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
          <h3 className="text-sm font-medium">Health Information (Optional)</h3>
          
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign up"}
        </Button>
      </form>
    </Form>
  )
}