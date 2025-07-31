"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Calendar,
  TrendingUp,
  Download,
  Eye,
} from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import { RoutinePreview } from "@/components/ai/routine-preview";
import { RoutineHistoryItem } from "@/types/ai-routines";


export default function RoutineHistoryPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<RoutineHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutineHistory();
  }, []);

  const fetchRoutineHistory = async () => {
    try {
      const response = await axios.get("/api/ai/routines");
      setRoutines(response.data.routines || []);
    } catch (err) {
      console.error("Error fetching routine history:", err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Failed to load routine history");
    } finally {
      setLoading(false);
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

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Routine History</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your AI-generated workout routines
          </p>
        </div>
        <Button onClick={() => router.push("/ai/generate")} className="gap-2">
          <Plus className="h-4 w-4" />
          Generate New Routine
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {routines.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                You haven&apos;t generated any AI routines yet
              </p>
              <Button onClick={() => router.push("/ai/generate")}>
                Generate Your First Routine
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {routines.map((routine) => (
            <Card key={routine.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      {routine.firstRoutine.title}
                    </CardTitle>
                    <CardDescription>
                      Generated {format(new Date(routine.createdAt), "PPP")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {routine.exportedToHevy && (
                      <Badge variant="secondary">
                        <Download className="h-3 w-3 mr-1" />
                        Exported
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      onClick={() => router.push(`/ai/routines/${routine.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Duration</span>
                    </div>
                    <p className="font-medium">
                      {routine.metadata.duration} weeks
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>Progression</span>
                    </div>
                    <p className="font-medium capitalize">
                      {routine.metadata.progressionType}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-muted-foreground">Focus Area</span>
                    </div>
                    <p className="font-medium capitalize">
                      {routine.metadata.focusArea || "Balanced"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Routines</span>
                    </div>
                    <p className="font-medium">
                      {routine.metadata.routineCount}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">
                    First Routine Preview
                  </h4>
                  <RoutinePreview routine={routine.firstRoutine} compact />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
