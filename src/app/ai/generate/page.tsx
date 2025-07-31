"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import axios from "axios";

const formSchema = z.object({
  workoutsPerWeek: z.number().min(1).max(7),
  sessionDuration: z.number().min(30).max(180),
  duration: z.number().min(1).max(12),
  focusArea: z.string().optional(),
  splitType: z.enum(["auto", "full_body", "upper_lower", "push_pull_legs", "body_part"]).optional(),
  progressionType: z.enum(["linear", "undulating", "block"]),
  specialInstructions: z.string().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function GenerateRoutinePage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workoutsPerWeek: 3,
      sessionDuration: 60,
      duration: 4,
      progressionType: "linear" as const,
      splitType: "auto" as const,
      focusArea: undefined,
      specialInstructions: undefined,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await axios.post("/api/ai/generate-routine", data);

      if (response.data.success) {
        // Navigate to the routine details page
        router.push(`/ai/routines/${response.data.routineId}`);
      }
    } catch (err) {
      console.error("Error generating routine:", err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(
        error.response?.data?.error ||
          "Failed to generate routine. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          AI Workout Generator
        </h1>
        <p className="text-muted-foreground mt-2">
          Create personalized workout routines powered by AI based on your
          training history and goals
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate New Routine</CardTitle>
          <CardDescription>
            Configure your preferences and let AI create the perfect workout
            plan for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="workoutsPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workouts Per Week</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="3"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 3)}
                          min={1}
                          max={7}
                        />
                      </FormControl>
                      <FormDescription>
                        How many days per week you plan to train (1-7)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sessionDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="60"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                          min={30}
                          max={180}
                          step={15}
                        />
                      </FormControl>
                      <FormDescription>
                        How long each workout session should be (30-180 minutes)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Duration (weeks)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="4"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 4)}
                          min={1}
                          max={12}
                        />
                      </FormControl>
                      <FormDescription>
                        Length of the training program (1-12 weeks)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="progressionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progression Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select progression type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="linear">
                            Linear Progression
                          </SelectItem>
                          <SelectItem value="undulating">
                            Daily Undulating
                          </SelectItem>
                          <SelectItem value="block">
                            Block Periodization
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How to progress weight and intensity over time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="focusArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Focus Area (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Based on profile" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Based on profile</SelectItem>
                          <SelectItem value="strength">Strength</SelectItem>
                          <SelectItem value="hypertrophy">
                            Muscle Building
                          </SelectItem>
                          <SelectItem value="endurance">Endurance</SelectItem>
                          <SelectItem value="power">Power</SelectItem>
                          <SelectItem value="general">
                            General Fitness
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Override your profile&apos;s focus areas for this
                        program
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="splitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Split (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Auto (AI decides)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="auto">
                            Auto (AI decides based on frequency)
                          </SelectItem>
                          <SelectItem value="full_body">
                            Full Body
                          </SelectItem>
                          <SelectItem value="upper_lower">
                            Upper/Lower Split
                          </SelectItem>
                          <SelectItem value="push_pull_legs">
                            Push/Pull/Legs
                          </SelectItem>
                          <SelectItem value="body_part">
                            Body Part Split
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How to split your training across workouts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specialInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="E.g., Preparing for a powerlifting meet, limited equipment, time constraints..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Any specific requirements or preferences for your program
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating your personalized routine...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Routine
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">1. Analysis</h3>
            <p className="text-sm text-muted-foreground">
              AI analyzes your profile, training history, and available
              exercises
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">2. Personalization</h3>
            <p className="text-sm text-muted-foreground">
              Creates a program tailored to your experience level, goals, and
              injuries
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">3. Periodization</h3>
            <p className="text-sm text-muted-foreground">
              Applies scientific training principles including progressive
              overload and deload weeks
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">4. Export</h3>
            <p className="text-sm text-muted-foreground">
              Export your routine directly to Hevy and start training
              immediately
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
