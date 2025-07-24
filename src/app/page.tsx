import { TestWorkoutService } from "@/components/test-workout-service";
import { TestExerciseTemplates } from "@/components/test-exercise-templates";
import { TestRoutines } from "@/components/test-routines";
import { TestRoutineFolders } from "@/components/test-routine-folders";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          AI Personal Trainer - Hevy Integration
        </h1>
        
        <div className="space-y-8">
          <TestWorkoutService />
          
          <div className="border-t pt-8">
            <TestExerciseTemplates />
          </div>
          
          <div className="border-t pt-8">
            <TestRoutines />
          </div>
          
          <div className="border-t pt-8">
            <TestRoutineFolders />
          </div>
        </div>
      </div>
    </div>
  );
}
