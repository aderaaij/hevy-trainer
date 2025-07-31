"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, ArrowLeft, Clock, Dumbbell, TrendingUp, Calendar } from 'lucide-react';
import axios from 'axios';
import { RoutinePreview } from '@/components/ai/routine-preview';
import { format } from 'date-fns';
import { GeneratedRoutine } from '@/types/ai-routines';


export default function RoutineDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [routine, setRoutine] = useState<GeneratedRoutine | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingIndex, setExportingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutineDetails();
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRoutineDetails = async () => {
    try {
      const response = await axios.get(`/api/ai/routines/${params.id}`);
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
        routineId: params.id,
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Duration</span>
                </div>
                <p className="font-semibold">{routine.metadata.duration} weeks</p>
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
                  <Dumbbell className="h-4 w-4" />
                  <span className="text-sm">Focus</span>
                </div>
                <p className="font-semibold capitalize">
                  {routine.metadata.focusArea || 'Balanced'}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Routines</span>
                </div>
                <p className="font-semibold">{routine.routines.length}</p>
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