"use client";

import { useState } from "react";
import { routineService } from "@/lib/hevy";
import type { HevyRoutinesResponse, Routine, HevyApiError } from "@/lib/hevy";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, FileText, Calendar, Users } from "lucide-react";

/**
 * Test component for the Hevy Routine Service
 */
export function TestRoutines() {
  const [routines, setRoutines] = useState<HevyRoutinesResponse | null>(null);
  const [singleRoutine, setSingleRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetRoutines = async (page: number = 1, pageSize: number = 5) => {
    setLoading(true);
    setError(null);
    setSingleRoutine(null);

    try {
      const response = await routineService.getRoutines({ page, pageSize });
      setRoutines(response);
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetSingleRoutine = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const routine = await routineService.getRoutine(id);
      setSingleRoutine(routine);
      setRoutines(null);
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSimpleRoutine = async () => {
    setLoading(true);
    setError(null);

    try {
      const routine = await routineService.createSimpleRoutine(
        `Test Routine ${Date.now()}`,
        [
          {
            exercise_template_id: "D04AC939", // Squat
            weight_kg: 60,
            reps: 10,
            sets: 3,
            rest_seconds: 90,
            notes: "Focus on form",
          },
        ],
        {
          notes: "Created via test component",
        }
      );
      setSingleRoutine(routine);
      setRoutines(null);
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Routine Service Test
          </CardTitle>
          <CardDescription>
            Manage workout routines with full CRUD operations. Create, read,
            update, and delete routines with exercises.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleGetRoutines(1, 5)}
              disabled={loading}
              variant="default"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Get Routines
            </Button>

            <Button
              onClick={() => handleGetRoutines(1, 10)}
              disabled={loading}
              variant="secondary"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Get 10 Routines
            </Button>

            <Button
              onClick={handleCreateSimpleRoutine}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Test Routine
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {singleRoutine && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Single Routine Details
            </CardTitle>
            <CardDescription>
              Detailed view of the selected routine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">ID:</span>
                    <Badge variant="outline">{singleRoutine.id}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Title:</span>
                    <span>{singleRoutine.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Notes:</span>
                    <span className="text-sm text-muted-foreground">
                      {singleRoutine.notes || "None"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Exercises:</span>
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Users className="h-3 w-3" />
                      {singleRoutine?.exercises?.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Folder:</span>
                    <Badge
                      variant={singleRoutine.folder_id ? "default" : "outline"}
                    >
                      {singleRoutine.folder_id || "No folder"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Created:</span>
                    <Badge
                      variant="outline"
                      className="text-xs flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3" />
                      {new Date(singleRoutine.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </div>

              {singleRoutine?.exercises?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Exercises:
                  </h4>
                  <div className="space-y-3">
                    {singleRoutine?.exercises?.map((exercise, index) => (
                      <Card key={index} className="bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-base">
                                {exercise.title}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {exercise.exercise_template_id}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Sets:</span>
                              <Badge variant="secondary">
                                {exercise.sets.length}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Rest:</span>
                              <Badge variant="outline">
                                {exercise.rest_seconds}s
                              </Badge>
                            </div>
                            {exercise.notes && (
                              <div className="flex justify-between items-start">
                                <span className="font-medium">Notes:</span>
                                <span className="text-sm text-muted-foreground">
                                  {exercise.notes}
                                </span>
                              </div>
                            )}

                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm font-medium mb-2">Sets:</p>
                              <div className="text-xs text-muted-foreground space-y-1">
                                {exercise.sets.map((set, setIndex) => (
                                  <Badge
                                    key={setIndex}
                                    variant="secondary"
                                    className="mr-2"
                                  >
                                    {set.weight_kg
                                      ? `${set.weight_kg}kg`
                                      : "BW"}{" "}
                                    × {set.reps}
                                    {set.rep_range
                                      ? ` (${set.rep_range.start}-${set.rep_range.end})`
                                      : ""}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {routines && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Response Summary</CardTitle>
              <CardDescription>
                Page {routines.page} of {routines.page_count} •{" "}
                {routines.routines.length} routines loaded
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routines.routines.map((routine) => (
              <Card
                key={routine.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleGetSingleRoutine(routine.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {routine.title}
                  </CardTitle>
                  <CardDescription>Click to view details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Users className="h-3 w-3" />
                        {routine.exercises.length} exercises
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Calendar className="h-3 w-3" />
                        {new Date(routine.created_at).toLocaleDateString()}
                      </Badge>
                      {routine.folder_id && (
                        <Badge variant="default">
                          Folder: {routine.folder_id}
                        </Badge>
                      )}
                    </div>
                    {routine.notes && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {routine.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
