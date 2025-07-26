import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6">
        <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Welcome back!</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            You&apos;re signed in as {user.email}
          </p>
        </div>
        
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