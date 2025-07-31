import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Repeat2, TrendingUp } from "lucide-react";
import { Routine, RoutineExercise, RoutineSet } from "@/types/ai-routines";


interface RoutinePreviewProps {
  routine: Routine;
  compact?: boolean;
}

export function RoutinePreview({
  routine,
  compact = false,
}: RoutinePreviewProps) {
  const groupedExercises = routine.exercises.reduce((acc, exercise) => {
    if (exercise.superset_id) {
      if (!acc[exercise.superset_id]) {
        acc[exercise.superset_id] = [];
      }
      acc[exercise.superset_id].push(exercise);
    } else {
      acc[`single_${exercise.exercise_template_id}`] = [exercise];
    }
    return acc;
  }, {} as Record<string, RoutineExercise[]>);

  const formatSetInfo = (set: RoutineSet) => {
    if (set.weight_kg) {
      return `${set.weight_kg}kg × ${set.reps} reps`;
    }
    return `${set.reps} reps`;
  };

  const getSetTypeBadge = (type: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      warmup: { variant: "secondary", label: "Warm-up" },
      normal: { variant: "default", label: "Working" },
      failure: { variant: "destructive", label: "To Failure" },
      drop: { variant: "outline", label: "Drop Set" },
    };

    const config = variants[type] || variants.normal;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Repeat2 className="h-4 w-4 text-muted-foreground" />
            <span>{routine.exercises.length} exercises</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span>
              {routine.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)}{" "}
              total sets
            </span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {routine.exercises
            .slice(0, 3)
            .map((ex) => ex.title)
            .join(", ")}
          {routine.exercises.length > 3 &&
            ` +${routine.exercises.length - 3} more`}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedExercises).map(([groupId, exercises]) => {
        const isSuperset = !groupId.startsWith("single_");

        return (
          <Card key={groupId} className={isSuperset ? "border-primary/50" : ""}>
            <CardContent className="pt-4">
              {isSuperset && (
                <Badge variant="outline" className="mb-3">
                  Superset {groupId}
                </Badge>
              )}

              <div className={isSuperset ? "space-y-4" : ""}>
                {exercises.map((exercise, idx) => (
                  <div
                    key={exercise.exercise_template_id}
                    className="space-y-3"
                  >
                    {isSuperset && idx > 0 && <div className="border-t pt-3" />}

                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h4 className="font-semibold">{exercise.title}</h4>
                        {exercise.notes && (
                          <p className="text-sm text-muted-foreground">
                            {exercise.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{exercise.rest_seconds}s rest</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {exercise.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-16">
                            Set {setIdx + 1}
                          </span>
                          {getSetTypeBadge(set.type)}
                          <span className="text-sm flex-1">
                            {formatSetInfo(set)}
                            {set.rep_range && (
                              <span className="text-muted-foreground ml-2">
                                (range: {set.rep_range.start}-
                                {set.rep_range.end})
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
