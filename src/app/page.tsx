import { TestWorkoutService } from "@/components/test-workout-service";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          AI Personal Trainer - Hevy Integration
        </h1>
        
        <TestWorkoutService />
      </div>
    </div>
  );
}
