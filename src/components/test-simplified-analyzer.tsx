"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { simplifiedAnalysisService } from "@/lib/analysis/simplified-analysis-service";
import { SimplifiedAnalysis } from "@/lib/analysis/simplified-workout-analyzer";

export default function TestSimplifiedAnalyzer() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SimplifiedAnalysis | null>(null);
  const [contextSummary, setContextSummary] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async (analysisType: "full" | "recent" | "quick") => {
    setIsLoading(true);
    setError(null);

    try {
      let result: SimplifiedAnalysis;

      switch (analysisType) {
        case "full":
          result = await simplifiedAnalysisService.analyzeUserWorkouts();
          break;
        case "recent":
          result = await simplifiedAnalysisService.analyzeRecentTrends();
          break;
        case "quick":
          result = await simplifiedAnalysisService.quickAnalysis(10);
          break;
        default:
          throw new Error("Invalid analysis type");
      }

      setAnalysis(result);

      // Also get the LLM context summary
      const { contextSummary: summary } =
        await simplifiedAnalysisService.generateAnalysisContext(analysisType);
      setContextSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Analysis error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return Math.round(num).toString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simplified Workout Analyzer</CardTitle>
          <CardDescription>
            Research assistant for LLM - provides objective stats and flags
            patterns, no recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => runAnalysis("quick")}
              disabled={isLoading}
              variant="outline"
            >
              Quick Analysis (10 workouts)
            </Button>
            <Button
              onClick={() => runAnalysis("recent")}
              disabled={isLoading}
              variant="outline"
            >
              Recent Trends (8 weeks)
            </Button>
            <Button onClick={() => runAnalysis("full")} disabled={isLoading}>
              Full Analysis (All workouts)
            </Button>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="text-lg">Analyzing workouts...</div>
              <div className="text-sm text-muted-foreground mt-2">
                Processing workout data for LLM context
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="flags">Flags</TabsTrigger>
            <TabsTrigger value="context">LLM Context</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Basic Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Workouts:</span>
                    <span className="font-medium">
                      {analysis.stats.totalWorkouts}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Training Period:</span>
                    <span className="font-medium">
                      {analysis.stats.timeSpan.totalWeeks} weeks
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg/Week:</span>
                    <span className="font-medium">
                      {analysis.stats.avgPerWeek.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Duration:</span>
                    <span className="font-medium">
                      {Math.round(analysis.stats.avgWorkoutDuration)} min
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Volume Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Volume:</span>
                    <span className="font-medium">
                      {formatNumber(analysis.stats.totalVolume)} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg/Workout:</span>
                    <span className="font-medium">
                      {formatNumber(analysis.stats.avgVolumePerWorkout)} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unique Exercises:</span>
                    <span className="font-medium">
                      {Object.keys(analysis.stats.exerciseFrequency).length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Time Range</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      First Workout
                    </div>
                    <div className="text-sm">
                      {new Date(
                        analysis.stats.timeSpan.firstWorkout
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Latest Workout
                    </div>
                    <div className="text-sm">
                      {new Date(
                        analysis.stats.timeSpan.lastWorkout
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Top Exercises</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analysis.stats.exerciseFrequency)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 8)
                      .map(([exercise, count]) => (
                        <div key={exercise} className="flex justify-between">
                          <span className="text-sm truncate">{exercise}</span>
                          <Badge variant="secondary">{count}x</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Muscle Group Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analysis.stats.muscleGroupDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 8)
                      .map(([muscle, count]) => (
                        <div key={muscle} className="flex justify-between">
                          <span className="text-sm capitalize">{muscle}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="flags" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">⚠️ Unusual Patterns</CardTitle>
                  <CardDescription>
                    Notable patterns for LLM attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.flags.unusualPatterns.length > 0 ? (
                    <div className="space-y-2">
                      {analysis.flags.unusualPatterns.map((pattern, index) => (
                        <Alert key={index}>
                          <AlertDescription className="text-sm">
                            {pattern}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No unusual patterns detected
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    🔍 Potential Concerns
                  </CardTitle>
                  <CardDescription>
                    Areas that might need attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.flags.potentialConcerns.length > 0 ? (
                    <div className="space-y-2">
                      {analysis.flags.potentialConcerns.map(
                        (concern, index) => (
                          <Alert key={index} variant="destructive">
                            <AlertDescription className="text-sm">
                              {concern}
                            </AlertDescription>
                          </Alert>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No major concerns identified
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Missing Muscle Groups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.flags.missingMuscleGroups.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {analysis.flags.missingMuscleGroups.map((group) => (
                        <Badge
                          key={group}
                          variant="secondary"
                          className="text-xs"
                        >
                          {group}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      All major muscle groups represented
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Consistency Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span>Training Consistency:</span>
                    <Badge
                      variant={
                        analysis.flags.consistencyIssues
                          ? "destructive"
                          : "default"
                      }
                    >
                      {analysis.flags.consistencyIssues
                        ? "Issues Detected"
                        : "Good"}
                    </Badge>
                  </div>
                  {analysis.flags.consistencyIssues && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Large gaps (&gt;2 weeks) detected between workouts
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="context" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>LLM Context Summary</CardTitle>
                <CardDescription>
                  Pre-formatted analysis for LLM consumption - ready to paste
                  into prompts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {contextSummary}
                  </pre>
                </div>
                <Button
                  className="mt-4"
                  onClick={() => navigator.clipboard.writeText(contextSummary)}
                >
                  Copy to Clipboard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raw" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Raw Analysis Data</CardTitle>
                <CardDescription>
                  Complete analysis object for debugging or custom processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md max-h-96 overflow-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(analysis, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
