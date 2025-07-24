'use client';

import { useState } from 'react';
import { exerciseTemplateService } from '@/lib/hevy';
import type { HevyExerciseTemplatesResponse, ExerciseTemplate, HevyApiError } from '@/lib/hevy';

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
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Exercise Template Service Test</h2>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => handleGetTemplates(1, 10)}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get Templates (Page 1)'}
        </button>
        
        <button
          onClick={() => handleGetTemplates(1, 20)}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get 20 Templates'}
        </button>

        <button
          onClick={() => handleGetTemplates(2, 10)}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get Page 2'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {singleTemplate && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-lg mb-2">Single Template Details</h3>
          <div className="space-y-1 text-sm">
            <p><strong>ID:</strong> {singleTemplate.id}</p>
            <p><strong>Title:</strong> {singleTemplate.title}</p>
            <p><strong>Type:</strong> {singleTemplate.type}</p>
            <p><strong>Primary Muscle:</strong> {singleTemplate.primary_muscle_group}</p>
            <p><strong>Secondary Muscles:</strong> {singleTemplate.secondary_muscle_groups.join(', ') || 'None'}</p>
            <p><strong>Equipment:</strong> {singleTemplate.equipment}</p>
            <p><strong>Custom:</strong> {singleTemplate.is_custom ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}

      {templates && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">API Response Summary</h3>
            <p>Page: {templates.page} of {templates.page_count}</p>
            <p>Exercise Templates: {templates.exercise_templates.length}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.exercise_templates.map((template) => (
              <div 
                key={template.id} 
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleGetSingleTemplate(template.id)}
              >
                <h4 className="font-semibold text-lg">{template.title}</h4>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p><strong>Type:</strong> {template.type.replace('_', ' ')}</p>
                  <p><strong>Primary Muscle:</strong> {template.primary_muscle_group}</p>
                  {template.secondary_muscle_groups.length > 0 && (
                    <p><strong>Secondary:</strong> {template.secondary_muscle_groups.join(', ')}</p>
                  )}
                  <p><strong>Equipment:</strong> {template.equipment}</p>
                  {template.is_custom && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded mt-2">
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Click to view details</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}