'use client';

import { useState } from 'react';
import { exerciseTemplateService } from '@/lib/hevy';
import type { HevyExerciseTemplatesResponse, ExerciseTemplate, HevyApiError } from '@/lib/hevy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Target } from 'lucide-react';

/**
 * Test component for the Hevy Exercise Template Service
 */
export function TestExerciseTemplates() {
  const [templates, setTemplates] = useState<HevyExerciseTemplatesResponse | null>(null);
  const [singleTemplate, setSingleTemplate] = useState<ExerciseTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleGetTemplates = async (page: number = 1, pageSize: number = 10) => {
    setLoading(true);
    setError(null);
    setSingleTemplate(null);
    
    try {
      const response = await exerciseTemplateService.getExerciseTemplates({ 
        page, 
        pageSize 
      });
      setTemplates(response);
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetSingleTemplate = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const template = await exerciseTemplateService.getExerciseTemplate(id);
      setSingleTemplate(template);
      setTemplates(null);
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
            <Target className="h-5 w-5" />
            Exercise Template Service Test
          </CardTitle>
          <CardDescription>
            Browse exercise templates with pagination support. Read-only access to the exercise database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleGetTemplates(1, 10)}
              disabled={loading}
              variant="default"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Templates
            </Button>
            
            <Button
              onClick={() => handleGetTemplates(1, 20)}
              disabled={loading}
              variant="secondary"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get 20 Templates
            </Button>

            <Button
              onClick={() => handleGetTemplates(2, 10)}
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Page 2
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {singleTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-4 w-4" />
              Single Template Details
            </CardTitle>
            <CardDescription>Detailed view of the selected exercise template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">ID:</span>
                  <Badge variant="outline">{singleTemplate.id}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Title:</span>
                  <span>{singleTemplate.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Type:</span>
                  <Badge variant="secondary" className="capitalize">
                    {singleTemplate.type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Equipment:</span>
                  <Badge variant="outline">{singleTemplate.equipment}</Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Primary Muscle:</span>
                  <Badge variant="default">{singleTemplate.primary_muscle_group}</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-medium">Secondary:</span>
                  <div className="flex flex-wrap gap-1 max-w-48">
                    {singleTemplate.secondary_muscle_groups.length > 0 ? (
                      singleTemplate.secondary_muscle_groups.map((muscle) => (
                        <Badge key={muscle} variant="secondary" className="text-xs">
                          {muscle}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Custom:</span>
                  <Badge variant={singleTemplate.is_custom ? "default" : "outline"}>
                    {singleTemplate.is_custom ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {templates && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Response Summary</CardTitle>
              <CardDescription>
                Page {templates.page} of {templates.page_count} • {templates.exercise_templates.length} templates loaded
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.exercise_templates.map((template) => (
              <Card 
                key={template.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleGetSingleTemplate(template.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <CardDescription className="capitalize">
                    {template.type.replace('_', ' ')} • {template.equipment}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">
                      {template.primary_muscle_group}
                    </Badge>
                    {template.secondary_muscle_groups.map((muscle) => (
                      <Badge key={muscle} variant="secondary" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                    {template.is_custom && (
                      <Badge variant="default">Custom</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Click to view details</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}