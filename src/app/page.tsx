import { TestWorkoutService } from "@/components/test-workout-service";
import { TestExerciseTemplates } from "@/components/test-exercise-templates";
import { TestRoutines } from "@/components/test-routines";
import { TestRoutineFolders } from "@/components/test-routine-folders";
import TestSimplifiedAnalyzer from "@/components/test-simplified-analyzer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <div className="flex justify-end mb-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Link href="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
                <form action="/api/auth/signout" method="POST">
                  <Button type="submit" variant="ghost">
                    Sign out
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Get started</Button>
                </Link>
              </div>
            )}
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            AI Personal Trainer
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Hevy API Integration Dashboard
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary">15 Endpoints</Badge>
            <Badge variant="secondary">4 Services</Badge>
            <Badge variant="secondary">TypeScript</Badge>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API Integration Test Dashboard</CardTitle>
            <CardDescription>
              Test and explore all Hevy API endpoints with real-time data. Each tab represents a different service with full CRUD operations where available.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="analyzer" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analyzer">Workout Analyzer</TabsTrigger>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
            <TabsTrigger value="routines">Routines</TabsTrigger>
            <TabsTrigger value="exercises">Exercise Templates</TabsTrigger>
            <TabsTrigger value="folders">Routine Folders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analyzer" className="mt-6">
            <TestSimplifiedAnalyzer />
          </TabsContent>
          
          <TabsContent value="workouts" className="mt-6">
            <TestWorkoutService />
          </TabsContent>
          
          <TabsContent value="routines" className="mt-6">
            <TestRoutines />
          </TabsContent>
          
          <TabsContent value="exercises" className="mt-6">
            <TestExerciseTemplates />
          </TabsContent>
          
          <TabsContent value="folders" className="mt-6">
            <TestRoutineFolders />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
