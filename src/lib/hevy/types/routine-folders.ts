/**
 * TypeScript types for Hevy API routine folder endpoints
 * Based on Postman collection analysis
 */

export interface HevyRoutineFoldersResponse {
  page: number;
  page_count: number;
  routine_folders: RoutineFolder[];
}

export interface RoutineFolder {
  id: string;
  title: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  // Additional fields may exist but not documented in Postman collection
}

export interface RoutineFolderFilters {
  page?: number;
  pageSize?: number;
}

// Request types for creating routine folders
export interface CreateRoutineFolderRequest {
  routine_folder: {
    title: string;
  };
}

// Since no UPDATE endpoint was found in the collection, we'll only include CREATE
// If UPDATE is discovered later, we can add UpdateRoutineFolderRequest