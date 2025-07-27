import { hevyApiClient } from '../client';
import {
  HevyRoutineFoldersResponse,
  RoutineFolder,
  RoutineFolderFilters,
  CreateRoutineFolderRequest,
} from '../types/routine-folders';

/**
 * Service for Hevy API routine folder endpoints
 * Based on Postman collection analysis - 3 endpoints confirmed
 */
export class RoutineFolderService {
  /**
   * Get a paginated list of routine folders
   * @param filters - Optional pagination filters
   */
  async getRoutineFolders(filters?: RoutineFolderFilters): Promise<HevyRoutineFoldersResponse> {
    const params = new URLSearchParams();
    
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/routine-folders?${queryString}` : '/routine-folders';
    
    return hevyApiClient.get<HevyRoutineFoldersResponse>(url);
  }

  /**
   * Get a single routine folder by ID
   * @param id - The routine folder ID
   */
  async getRoutineFolder(id: string): Promise<RoutineFolder> {
    return hevyApiClient.get<RoutineFolder>(`/routine-folders/${id}`);
  }

  /**
   * Create a new routine folder
   * @param folder - The routine folder data to create
   */
  async createRoutineFolder(folder: CreateRoutineFolderRequest): Promise<RoutineFolder> {
    return hevyApiClient.post<RoutineFolder>('/routine-folders', folder);
  }

  // Helper methods

  /**
   * Get all routine folders (helper method)
   * @param limit - Maximum number of folders to retrieve (default: 50)
   */
  async getAllRoutineFolders(limit: number = 50): Promise<RoutineFolder[]> {
    const response = await this.getRoutineFolders({ page: 1, pageSize: limit });
    return response.routine_folders;
  }

  /**
   * Get a specific page of routine folders
   * @param page - Page number
   * @param pageSize - Number of items per page
   */
  async getRoutineFoldersPage(page: number = 1, pageSize: number = 10): Promise<HevyRoutineFoldersResponse> {
    return this.getRoutineFolders({ page, pageSize });
  }

  /**
   * Create a routine folder with just a title (simplified method)
   * @param title - The folder title
   */
  async createFolder(title: string): Promise<RoutineFolder> {
    return this.createRoutineFolder({
      routine_folder: {
        title,
      },
    });
  }

  /**
   * Get all routine folders and fetch full details for each
   * WARNING: This makes multiple API calls - use sparingly
   */
  async getAllRoutineFoldersWithDetails(): Promise<RoutineFolder[]> {
    const foldersResponse = await this.getRoutineFolders({ pageSize: 100 });
    
    // If we need full details for each folder, fetch them individually
    const detailedFolders = await Promise.all(
      foldersResponse.routine_folders.map(folder => 
        this.getRoutineFolder(folder.id)
      )
    );
    
    return detailedFolders;
  }
}

// Export singleton instance
export const routineFolderService = new RoutineFolderService();