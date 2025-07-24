'use client';

import { useState } from 'react';
import { routineFolderService } from '@/lib/hevy';
import type { HevyRoutineFoldersResponse, RoutineFolder, HevyApiError } from '@/lib/hevy';

/**
 * Test component for the Hevy Routine Folder Service
 */
export function TestRoutineFolders() {
  const [folders, setFolders] = useState<HevyRoutineFoldersResponse | null>(null);
  const [singleFolder, setSingleFolder] = useState<RoutineFolder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFolderTitle, setNewFolderTitle] = useState('');

  const handleGetFolders = async (page: number = 1, pageSize: number = 10) => {
    setLoading(true);
    setError(null);
    setSingleFolder(null);
    
    try {
      const response = await routineFolderService.getRoutineFolders({ page, pageSize });
      setFolders(response);
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetSingleFolder = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const folder = await routineFolderService.getRoutineFolder(id);
      setSingleFolder(folder);
      setFolders(null);
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderTitle.trim()) {
      setError('Please enter a folder title');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const folder = await routineFolderService.createFolder(newFolderTitle);
      setSingleFolder(folder);
      setFolders(null);
      setNewFolderTitle('');
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestFolder = async () => {
    const testTitle = `Test Folder ${Date.now()}`;
    setLoading(true);
    setError(null);
    
    try {
      const folder = await routineFolderService.createFolder(testTitle);
      setSingleFolder(folder);
      setFolders(null);
    } catch (err) {
      const apiError = err as HevyApiError;
      setError(`Error ${apiError.status}: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Routine Folder Service Test</h2>
      
      <div className="space-y-4 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => handleGetFolders(1, 10)}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Get Folders'}
          </button>
          
          <button
            onClick={handleCreateTestFolder}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Create Test Folder'}
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newFolderTitle}
            onChange={(e) => setNewFolderTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            placeholder="Enter folder title..."
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreateFolder}
            disabled={loading || !newFolderTitle.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Create Folder'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {singleFolder && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-lg mb-2">Single Folder Details</h3>
          <div className="space-y-1 text-sm">
            <p><strong>ID:</strong> {singleFolder.id}</p>
            <p><strong>Title:</strong> {singleFolder.title}</p>
            <p><strong>Created:</strong> {new Date(singleFolder.created_at).toLocaleString()}</p>
            <p><strong>Updated:</strong> {new Date(singleFolder.updated_at).toLocaleString()}</p>
          </div>
        </div>
      )}

      {folders && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">API Response Summary</h3>
            <p>Page: {folders.page} of {folders.page_count}</p>
            <p>Routine Folders: {folders.routine_folders.length}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.routine_folders.map((folder) => (
              <div 
                key={folder.id} 
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleGetSingleFolder(folder.id)}
              >
                <h4 className="font-semibold text-lg">{folder.title}</h4>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p><strong>ID:</strong> {folder.id}</p>
                  <p><strong>Created:</strong> {new Date(folder.created_at).toLocaleDateString()}</p>
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