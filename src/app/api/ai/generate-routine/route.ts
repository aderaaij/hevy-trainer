import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@/generated/prisma";
import OpenAI from "openai";
import { trainingDataService } from "@/lib/ai/training-data-service";
import { routineTransformer } from "@/lib/ai/routine-transformer";
import { tryParseJson, extractJsonFromText } from "@/lib/utils/json-repair";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Personal trainer system prompt
const SYSTEM_PROMPT = `You are an expert personal trainer with deep knowledge of exercise science, periodization, and progressive overload. Your role is to create sustainable, personalized training programs that users can follow for extended periods.

Key principles to follow:
1. Create complementary routines based on training frequency (e.g., 3x/week = Push/Pull/Legs)
2. Design routines to be repeated for the entire program duration (4-6 weeks typically)
3. Include clear progression guidelines within the routine notes
4. Plan for deload periods (typically week 5 or after 4 weeks of training)
5. Consider session duration constraints when selecting exercise volume

Training Split Guidelines:
- 1-2x/week: Full body routines
- 3x/week: Push/Pull/Legs or Full body variations
- 4x/week: Upper/Lower split
- 5-6x/week: Push/Pull/Legs/Upper/Lower or Body part split
- 7x/week: Advanced body part split with active recovery

When creating routines:
- Each routine should fit within the specified session duration
- Include warm-up sets for compound movements (not counted in session time)
- Provide week-by-week progression instructions in the notes
- Add checkpoint recommendations (e.g., "After 3 weeks, assess if deload needed")
- Consider user's focus areas, injuries, and experience level
- Balance volume across muscle groups throughout the week

You will receive:
1. User profile data (age, weight, experience, goals, injuries)
2. Recent workout history with volume and frequency analysis
3. Available exercises grouped by muscle and equipment
4. Progression trends from recent training

Return a structured JSON response with the following format:
{
  "routines": [
    {
      "title": "Program name: Specific routine (e.g., '6-Week PPL: Push Day')",
      "notes": "Detailed notes including:\n- Routine focus and goals\n- Week-by-week progression (e.g., 'Weeks 1-2: Base building, add 2.5kg when hitting rep targets')\n- Deload protocol (e.g., 'Week 5: Reduce weight by 30%, focus on form')\n- When to reassess (e.g., 'After 6 weeks, return for new program based on progress')",
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
  "reasoning": "Explanation of split choice, exercise selection, and progression strategy",
  "periodization_notes": "Complete program overview including training schedule and long-term progression"
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
      workoutsPerWeek = 3,
      sessionDuration = 60, // minutes
      focusArea = null,
      splitType = "auto",
      duration = 4, // weeks
      specialInstructions = "",
      progressionType = "linear", // linear, undulating, or block
    } = body;

    // Validate input
    if (workoutsPerWeek < 1 || workoutsPerWeek > 7) {
      return NextResponse.json(
        {
          error: "Workouts per week must be between 1 and 7",
        },
        { status: 400 }
      );
    }

    if (sessionDuration < 30 || sessionDuration > 180) {
      return NextResponse.json(
        {
          error: "Session duration must be between 30 and 180 minutes",
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

    // Determine number of routines based on frequency and split type
    let routineCount = workoutsPerWeek;
    if (splitType === "full_body" && workoutsPerWeek > 2) {
      routineCount = Math.min(3, workoutsPerWeek); // For full body, create fewer unique routines
    }

    // Create the prompt for OpenAI
    const userPrompt = `Create a ${duration}-week training program for someone who trains ${workoutsPerWeek}x per week, ${sessionDuration} minutes per session.

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

Program Requirements:
- Training frequency: ${workoutsPerWeek}x per week
- Session duration: ${sessionDuration} minutes per session
- Program duration: ${duration} weeks
- Training split: ${splitType === "auto" ? "Choose based on frequency" : splitType.replace(/_/g, " ")}
- Focus area: ${focusArea || "Based on user profile and history"}
- Progression type: ${progressionType}
- Special instructions: ${specialInstructions}

Create ${routineCount} complementary routines that form a complete weekly training program:
1. Each routine should be designed to be repeated for the entire ${duration}-week period
2. Include detailed progression instructions in each routine's notes
3. Plan deload protocol for week ${Math.min(duration, 5)} if duration >= 4 weeks
4. Each workout must fit within ${sessionDuration} minutes (excluding warm-up sets)
5. Consider user's experience level: ${trainingContext.profile.experienceLevel || "intermediate"}
6. Account for other activities: ${trainingContext.profile.otherActivities || "none"}
7. Provide clear guidance on when to increase weight/reps
8. Include recommendation for program reassessment after ${duration} weeks

IMPORTANT: Create routines that work together as a cohesive program. For example:
- 3x/week: Create Push, Pull, and Legs routines
- 4x/week: Create Upper A, Lower A, Upper B, Lower B
- Ensure all muscle groups are adequately trained across the week

CRITICAL: Return ONLY valid JSON in the specified format. Do not include any text before or after the JSON. 
The response must be valid JSON that can be parsed without errors. Escape all quotes within strings properly.

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
          temperature: 0.3, // Lower temperature for more consistent JSON
          max_tokens: 6000, // Increased token limit for complex routines
          seed: attempt, // Different seed for each attempt
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
          throw new Error("Empty response from AI");
        }

        // Try to extract and parse JSON from the response
        let jsonContent = responseContent;
        const extractedJson = extractJsonFromText(responseContent);
        if (extractedJson) {
          jsonContent = extractedJson;
        }

        const parseResult = tryParseJson<AIRoutineResponse>(jsonContent, {
          attemptRepair: true,
          logErrors: true
        });

        if (!parseResult.success) {
          // Store the raw response for debugging
          console.error('Failed to parse AI response:', {
            attempt,
            error: parseResult.error,
            rawResponse: responseContent,
            extractedJson: jsonContent
          });
          
          // Save to database for analysis
          try {
            await prisma.errorLog.create({
              data: {
                type: 'ai_json_parse_error',
                error: parseResult.error,
                context: {
                  attempt,
                  rawResponse: responseContent,
                  extractedJson: jsonContent,
                  userId: user.id
                }
              }
            });
          } catch (dbError) {
            console.error('Failed to log error to database:', dbError);
          }
          
          // If this is the last attempt, throw the error
          if (attempt >= 3) {
            throw new Error(`Failed to parse AI response after ${attempt} attempts: ${parseResult.error}`);
          }
          
          // Otherwise, continue to next attempt
          throw new Error(`JSON parse failed (attempt ${attempt}): ${parseResult.error}`);
        }

        aiResponse = parseResult.data;

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
          // Log the technical error details
          console.error(`Final AI generation failure after ${attempt} attempts:`, error);
          
          // Provide user-friendly error message
          let userMessage = "We're having trouble generating your routine right now. Please try again in a few moments.";
          
          if (error instanceof Error) {
            if (error.message.includes("JSON parse")) {
              userMessage = "The AI response was malformed. We've logged this issue and our team will review it. Please try generating a simpler routine or try again later.";
            } else if (error.message.includes("Invalid exercise IDs")) {
              userMessage = "Some exercises in the generated routine weren't recognized. Please try syncing your exercises from Hevy again.";
            } else if (error.message.includes("Invalid response structure")) {
              userMessage = "The AI generated an invalid routine structure. Please try again with different parameters.";
            }
          }
          
          return NextResponse.json(
            { 
              error: userMessage,
              technical: process.env.NODE_ENV === 'development' ? error?.message : undefined
            },
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

    // The AI now creates complementary routines that are meant to be repeated
    // No need to generate multiple weeks - the progression is in the notes
    const processedRoutines = aiResponse.routines;

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
          workoutsPerWeek,
          sessionDuration,
          splitType,
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
        workoutsPerWeek,
        sessionDuration,
        splitType,
        progressionType,
        focusArea,
        exerciseCount: trainingContext.availableExercises.total,
        routineCount: processedRoutines.length,
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
