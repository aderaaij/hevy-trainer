import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "@/components/profile/profile-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          Manage your personal information and training preferences to get better AI-generated workout recommendations.
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ProfileForm />
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Why we need this information
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Age and experience help determine appropriate training volume</li>
                <li>• Weight tracking helps with progression calculations</li>
                <li>• Focus areas guide exercise selection</li>
                <li>• Injury information ensures safe programming</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Privacy & Security
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200">
                Your data is encrypted and only used to personalize your workout experience. 
                We never share your personal information with third parties.
              </p>
            </div>
            
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Getting Started
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                Complete your profile to unlock:
              </p>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <li>• Personalized workout routines</li>
                <li>• Progress tracking & analytics</li>
                <li>• Injury-aware programming</li>
                <li>• Goal-specific recommendations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}