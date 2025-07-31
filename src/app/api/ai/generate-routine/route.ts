import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@/generated/prisma";
import OpenAI from "openai";
import { trainingDataService } from "@/lib/ai/training-data-service";
import { routineTransformer } from "@/lib/ai/routine-transformer";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Personal trainer system prompt
const SYSTEM_PROMPT = `You are an expert personal trainer with deep knowledge of exercise science, periodization, and progressive overload. Your role is to create intelligent, personalized workout routines based on the user's profile, training history, and available exercises.

Key principles to follow:
1. Progressive Overload: Gradually increase volume, intensity, or complexity
2. Periodization: Include mesocycles with varying intensities and deload weeks (typically every 4th week)
3. Exercise Variation: Rotate exercises to prevent adaptation and boredom
4. Recovery: Ensure adequate rest between training same muscle groups
5. Individual Adaptation: Consider user's experience level, injuries, and goals

When creating routines:
- Match training frequency to user's availability
- Consider user's focus areas (strength, hypertrophy, endurance)
- Account for injuries and avoid exercises that could aggravate them
- Include proper warm-up sets for compound movements
- Balance muscle groups to prevent imbalances
- Consider other activities that might impact recovery

You will receive:
1. User profile data (age, weight, experience, goals, injuries)
2. Recent workout history with volume and frequency analysis
3. Available exercises grouped by muscle and equipment
4. Progression trends from recent training

Return a structured JSON response with the following format:
{
  "routines": [
    {
      "title": "Routine name with week/phase",
      "notes": "Detailed notes about the routine goals and focus",
      "exercises": [
        {
          "exercise_template_id": "exact ID from available exercises",
          "title": "Exercise name for reference",
          "superset_id": null or "A"/"B" for supersets,
          "rest_seconds": 90-180 for compounds, 60-90 for accessories,
          "notes": "Form cues or special instructions",
          "sets": [
            {
              "type": "warmup" or "normal",
              "weight_kg": number or null,
              "reps": target reps,
              "rep_range": {
                "start": minimum acceptable reps,
                "end": maximum acceptable reps
              }
            }
          ]
        }
      ]
    }
  ],
  "reasoning": "Detailed explanation of the program design choices",
  "periodization_notes": "Overview of the mesocycle structure and progression plan"
}`;

// Type definitions for OpenAI response
interface AIRoutineResponse {
  routines: {
    title: string;
    notes: string;
    exercises: {
      exercise_template_id: string;
      title: string;
      superset_id: string | null;
      rest_seconds: number;
      notes: string | null;
      sets: {
        type: "normal" | "warmup" | "failure" | "drop";
        weight_kg: number | null;
        reps: number;
        rep_range: {
          start: number;
          end: number;
        };
      }[];
    }[];
  }[];
  reasoning: string;
  periodization_notes: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request data
    const body = await request.json();
    const {
      routineCount = 1,
      focusArea = null,
      duration = 4, // weeks
      specialInstructions = "",
      progressionType = "linear", // linear, undulating, or block
    } = body;

    // Validate input
    if (routineCount < 1 || routineCount > 7) {
      return NextResponse.json(
        {
          error: "Routine count must be between 1 and 7",
        },
        { status: 400 }
      );
    }

    if (duration < 1 || duration > 12) {
      return NextResponse.json(
        {
          error: "Duration must be between 1 and 12 weeks",
        },
        { status: 400 }
      );
    }

    // Gather comprehensive training context
    const trainingContext = await trainingDataService.gatherTrainingContext(
      user.id
    );

    if (trainingContext.availableExercises.total === 0) {
      return NextResponse.json(
        {
          error:
            "No exercises found. Please sync your exercises from Hevy first.",
        },
        { status: 400 }
      );
    }

    // Create the prompt for OpenAI
    const userPrompt = `Create ${routineCount} workout routine(s) for the following user:

User Profile:
${JSON.stringify(trainingContext.profile, null, 2)}

Training History Analysis:
- Recent workouts: ${
      trainingContext.trainingHistory.recentWorkouts.length
    } in last 8 weeks
- Weekly volume trend: ${trainingContext.trainingHistory.weeklyVolume.join(
      ", "
    )} kg
- Volume progression: ${
      trainingContext.trainingHistory.progressionTrends.volumeTrend
    }
- Intensity progression: ${
      trainingContext.trainingHistory.progressionTrends.intensityTrend
    }
- Training days: ${JSON.stringify(
      trainingContext.trainingHistory.frequencyPattern
    )}
- Muscle group frequency: ${JSON.stringify(
      trainingContext.trainingHistory.muscleGroupFrequency
    )}

Available Exercises by Muscle Group:
${Object.entries(trainingContext.availableExercises.byMuscleGroup)
  .map(([muscle, exercises]) => `${muscle}: ${exercises.length} exercises`)
  .join("\n")}

Available Equipment:
${Object.keys(trainingContext.availableExercises.byEquipment).join(", ")}

Full Exercise List:
${JSON.stringify(trainingContext.availableExercises.byMuscleGroup, null, 2)}

Additional Requirements:
- Duration: ${duration} weeks
- Focus area: ${focusArea || "Based on user profile and history"}
- Progression type: ${progressionType}
- Special instructions: ${specialInstructions}

Please create a complete mesocycle with:
1. Appropriate periodization (include deload week if duration >= 4 weeks)
2. Exercise selection based on available equipment and user's injury status
3. Progressive overload following ${progressionType} progression
4. Volume and intensity appropriate for ${
      trainingContext.profile.experienceLevel || "intermediate"
    } level
5. Consider other activities: ${
      trainingContext.profile.otherActivities || "none"
    }

Return the response in the specified JSON format.`;

    // Call OpenAI with retry logic
    let attempt = 0;
    let aiResponse: AIRoutineResponse | null = null;

    while (attempt < 3 && !aiResponse) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4.1-2025-04-14",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 4000,
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
          throw new Error("Empty response from AI");
        }

        aiResponse = JSON.parse(responseContent) as AIRoutineResponse;

        // Validate the response structure
        if (!aiResponse.routines || !Array.isArray(aiResponse.routines)) {
          throw new Error("Invalid response structure from AI");
        }

        // Validate exercise IDs
        const availableIds = Object.values(
          trainingContext.availableExercises.byMuscleGroup
        )
          .flat()
          .map((e) => e.id);

        for (const routine of aiResponse.routines) {
          const validation = routineTransformer.validateExerciseIds(
            routine,
            availableIds
          );
          if (!validation.valid) {
            console.error(
              "Invalid exercise IDs in AI response:",
              validation.invalidIds
            );
            throw new Error(
              `AI generated invalid exercise IDs: ${validation.invalidIds.join(
                ", "
              )}`
            );
          }
        }
      } catch (error) {
        attempt++;
        console.error(`OpenAI attempt ${attempt} failed:`, error);

        if (attempt >= 3) {
          if (error instanceof Error) {
            return NextResponse.json(
              { error: `AI generation failed: ${error.message}` },
              { status: 500 }
            );
          }
          return NextResponse.json(
            { error: "Failed to generate routine after multiple attempts" },
            { status: 500 }
          );
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    if (!aiResponse) {
      return NextResponse.json(
        { error: "Failed to generate routine" },
        { status: 500 }
      );
    }

    // Apply progressive overload if generating multiple weeks
    let processedRoutines = aiResponse.routines;
    if (duration > 1 && processedRoutines.length === 1) {
      // Generate additional weeks based on the base routine
      const baseRoutine = processedRoutines[0];
      processedRoutines = [];

      for (let week = 1; week <= duration; week++) {
        if (week % 4 === 0 && duration >= 4) {
          // Deload week
          processedRoutines.push(
            routineTransformer.createDeloadRoutine(baseRoutine)
          );
        } else {
          // Regular training week with progressive overload
          processedRoutines.push(
            routineTransformer.applyProgressiveOverload(
              baseRoutine,
              week,
              progressionType as "linear" | "undulating" | "block"
            )
          );
        }
      }
    }

    // Save the generated routine to database
    const generatedRoutine = await prisma.generatedRoutine.create({
      data: {
        name:
          processedRoutines[0]?.title ||
          `AI Generated Routine - ${new Date().toISOString().split("T")[0]}`,
        userId: user.id,
        routineData: processedRoutines,
        aiContext: {
          model: "gpt-4.1-2025-04-14",
          prompt: userPrompt,
          reasoning: aiResponse.reasoning,
          periodizationNotes: aiResponse.periodization_notes,
          trainingContext,
          progressionType,
          duration,
          focusArea,
        },
        exportedToHevy: false,
      },
    });

    return NextResponse.json({
      success: true,
      routineId: generatedRoutine.id,
      routines: processedRoutines,
      reasoning: aiResponse.reasoning,
      periodizationNotes: aiResponse.periodization_notes,
      metadata: {
        duration,
        progressionType,
        focusArea,
        exerciseCount: trainingContext.availableExercises.total,
      },
    });
  } catch (error) {
    console.error("Error in generate routine endpoint:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
