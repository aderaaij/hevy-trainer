import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Settings, Home } from "lucide-react"
import { SyncStatus } from "@/components/sync/sync-status"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid gap-6">
        <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Welcome back!</h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                You&apos;re signed in as {user.email}
              </p>
            </div>
            <Link href="/profile">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Sync Status */}
        <SyncStatus />
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Import Workouts</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Connect your Hevy account to import workout history
            </p>
            <button className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded hover:opacity-90">
              Coming soon
            </button>
          </div>
          
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Generate Routine</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Create AI-powered workout routines based on your history
            </p>
            <button className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded hover:opacity-90">
              Coming soon
            </button>
          </div>
          
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
            <h3 className="font-semibold mb-2">View Analysis</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              See insights about your training progress
            </p>
            <button className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded hover:opacity-90">
              Coming soon
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}