"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, ArrowLeft, Clock, Dumbbell, TrendingUp, Calendar, Repeat2, Target } from 'lucide-react';
import axios from 'axios';
import { RoutinePreview } from '@/components/ai/routine-preview';
import { format } from 'date-fns';
import { GeneratedRoutine } from '@/types/ai-routines';


// Helper function to determine which workout should be done on which day
function getWorkoutForDay(dayIndex: number, workoutsPerWeek: number, routineCount: number): number | null {
  // Common training schedules
  const schedules: Record<number, number[]> = {
    1: [0], // Monday only
    2: [0, 3], // Monday, Thursday
    3: [0, 2, 4], // Monday, Wednesday, Friday
    4: [0, 1, 3, 4], // Monday, Tuesday, Thursday, Friday
    5: [0, 1, 2, 3, 4], // Monday through Friday
    6: [0, 1, 2, 3, 4, 5], // Monday through Saturday
    7: [0, 1, 2, 3, 4, 5, 6], // Every day
  };

  const schedule = schedules[workoutsPerWeek] || schedules[3];
  const workoutDayIndex = schedule.indexOf(dayIndex);
  
  if (workoutDayIndex === -1) return null;
  
  // Cycle through available routines
  return workoutDayIndex % routineCount;
}

export default function RoutineDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const routineId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [routine, setRoutine] = useState<GeneratedRoutine | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingIndex, setExportingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (routineId) {
      fetchRoutineDetails();
    }
  }, [routineId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRoutineDetails = async () => {
    if (!routineId) return;
    
    try {
      const response = await axios.get(`/api/ai/routines/${routineId}`);
      setRoutine(response.data);
    } catch (err) {
      console.error('Error fetching routine:', err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load routine');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToHevy = async (routineIndex: number) => {
    setExporting(true);
    setExportingIndex(routineIndex);
    setError(null);

    try {
      const response = await axios.post('/api/ai/export-routine', {
        routineId: routineId,
        routineIndex
      });

      if (response.data.success) {
        // Refresh routine data to show export status
        await fetchRoutineDetails();
        // Show success message or toast
      }
    } catch (err) {
      console.error('Error exporting routine:', err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to export routine');
    } finally {
      setExporting(false);
      setExportingIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !routine) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-destructive">{error || 'Routine not found'}</p>
              <Button onClick={() => router.push('/ai/generate')}>
                Generate New Routine
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/ai/history')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Button>
        <div className="text-sm text-muted-foreground">
          Generated {format(new Date(routine.createdAt), 'PPp')}
        </div>
      </div>

      <div className="space-y-6">
        {/* Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle>Program Overview</CardTitle>
            <CardDescription>
              AI-generated workout program based on your profile and training history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Duration</span>
                </div>
                <p className="font-semibold">{routine.metadata.duration} weeks</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Repeat2 className="h-4 w-4" />
                  <span className="text-sm">Frequency</span>
                </div>
                <p className="font-semibold">{routine.metadata.workoutsPerWeek || routine.routines.length}x/week</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Session</span>
                </div>
                <p className="font-semibold">{routine.metadata.sessionDuration || 60} min</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Dumbbell className="h-4 w-4" />
                  <span className="text-sm">Split</span>
                </div>
                <p className="font-semibold capitalize">
                  {routine.metadata.splitType?.replace(/_/g, ' ') || 'Custom'}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Progression</span>
                </div>
                <p className="font-semibold capitalize">{routine.metadata.progressionType}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Focus</span>
                </div>
                <p className="font-semibold capitalize">
                  {routine.metadata.focusArea || 'Balanced'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for routines and insights */}
        <Tabs defaultValue="routines" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="routines">Routines</TabsTrigger>
            <TabsTrigger value="reasoning">AI Reasoning</TabsTrigger>
            <TabsTrigger value="periodization">Periodization</TabsTrigger>
          </TabsList>

          <TabsContent value="routines" className="space-y-4">
            {/* Training Schedule Card */}
            {routine.metadata.workoutsPerWeek && routine.routines.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Training Schedule</CardTitle>
                  <CardDescription>
                    Recommended training days for your {routine.metadata.workoutsPerWeek}x/week program
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => {
                      const workoutIndex = getWorkoutForDay(dayIndex, routine.metadata.workoutsPerWeek || 3, routine.routines.length);
                      return (
                        <div key={day} className="text-center">
                          <div className="text-sm font-medium mb-1">{day}</div>
                          <div className={`p-2 rounded-md text-xs ${workoutIndex !== null ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {workoutIndex !== null ? routine.routines[workoutIndex].title.split(':')[1]?.trim() || `Day ${workoutIndex + 1}` : 'Rest'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {routine.routines.map((r, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{r.title}</CardTitle>
                      <CardDescription className="mt-2 whitespace-pre-line">
                        {r.notes}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {routine.exportedToHevy && index === 0 && (
                        <Badge variant="secondary">Exported</Badge>
                      )}
                      <Button
                        onClick={() => handleExportToHevy(index)}
                        disabled={exporting || (routine.exportedToHevy && index === 0)}
                        size="sm"
                      >
                        {exporting && exportingIndex === index ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Export to Hevy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <RoutinePreview routine={r} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="reasoning">
            <Card>
              <CardHeader>
                <CardTitle>AI Reasoning</CardTitle>
                <CardDescription>
                  Why the AI designed your program this way
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{routine.reasoning}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="periodization">
            <Card>
              <CardHeader>
                <CardTitle>Periodization Notes</CardTitle>
                <CardDescription>
                  How your program progresses over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{routine.periodizationNotes}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}