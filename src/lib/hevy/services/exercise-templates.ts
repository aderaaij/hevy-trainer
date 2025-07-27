import { hevyApiClient } from '../client';
import {
  HevyExerciseTemplatesResponse,
  ExerciseTemplate,
  ExerciseTemplateFilters,
} from '../types/exercise-templates';

/**
 * Service for fetching exercise templates from the Hevy API
 * Note: The API only supports fetching templates with pagination
 */
export class ExerciseTemplateService {
  /**
   * Get a paginated list of exercise templates
   * @param filters - Optional pagination filters (page and pageSize only)
   */
  async getExerciseTemplates(filters?: ExerciseTemplateFilters): Promise<HevyExerciseTemplatesResponse> {
    const params = new URLSearchParams();
    
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/exercise-templates?${queryString}` : '/exercise-templates';
    
    return hevyApiClient.get<HevyExerciseTemplatesResponse>(url);
  }

  /**
   * Get a single exercise template by ID
   * @param id - The exercise template ID
   */
  async getExerciseTemplate(id: string): Promise<ExerciseTemplate> {
    return hevyApiClient.get<ExerciseTemplate>(`/exercise-templates/${id}`);
  }

  /**
   * Get all exercise templates (helper method that fetches all pages)
   * WARNING: This may take a while if there are many templates (215+ pages)
   */
  async getAllExerciseTemplates(): Promise<ExerciseTemplate[]> {
    const allTemplates: ExerciseTemplate[] = [];
    let currentPage = 1;
    let totalPages = 1;
    
    do {
      const response = await this.getExerciseTemplates({
        page: currentPage,
        pageSize: 100, // Maximum allowed
      });
      
      allTemplates.push(...response.exercise_templates);
      totalPages = response.page_count;
      currentPage++;
    } while (currentPage <= totalPages);
    
    return allTemplates;
  }

  /**
   * Get a specific page of exercise templates
   * @param page - Page number
   * @param pageSize - Number of items per page (max 100)
   */
  async getExerciseTemplatesPage(page: number = 1, pageSize: number = 20): Promise<HevyExerciseTemplatesResponse> {
    return this.getExerciseTemplates({ page, pageSize });
  }
}

// Export singleton instance
export const exerciseTemplateService = new ExerciseTemplateService();