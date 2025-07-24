"use client";

import { useState } from "react";
import { routineFolderService } from "@/lib/hevy";
import type {
  HevyRoutineFoldersResponse,
  RoutineFolder,
  HevyApiError,
} from "@/lib/hevy";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, FolderPlus, Folder, Calendar } from 'lucide-react';

/**
 * Test component for the Hevy Routine Folder Service
 */
export function TestRoutineFolders() {
  const [folders, setFolders] = useState<HevyRoutineFoldersResponse | null>(
    null
  );
  const [singleFolder, setSingleFolder] = useState<RoutineFolder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFolderTitle, setNewFolderTitle] = useState("");

  const handleGetFolders = async (page: number = 1, pageSize: number = 10) => {
    setLoading(true);
    setError(null);
    setSingleFolder(null);

    try {
      const response = await routineFolderService.getRoutineFolders({
        page,
        pageSize,
      });
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
      setError("Please enter a folder title");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const folder = await routineFolderService.createFolder(newFolderTitle);
      setSingleFolder(folder);
      setFolders(null);
      setNewFolderTitle("");
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Routine Folder Service Test
          </CardTitle>
          <CardDescription>
            Organize your routines with folders. Full CRUD operations including create, read, and manage routine folders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <Button
              onClick={() => handleGetFolders(1, 10)}
              disabled={loading}
              variant="default"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Folders
            </Button>

            <Button
              onClick={handleCreateTestFolder}
              disabled={loading}
              variant="secondary"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Test Folder
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              type="text"
              value={newFolderTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderTitle(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleCreateFolder()}
              placeholder="Enter folder title..."
              className="flex-1"
            />
            <Button
              onClick={handleCreateFolder}
              disabled={loading || !newFolderTitle.trim()}
              variant="outline"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
              Create Folder
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {singleFolder && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Single Folder Details</CardTitle>
            <CardDescription>Detailed view of the selected folder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">ID:</span>
                <Badge variant="outline">{singleFolder.id}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Title:</span>
                <span>{singleFolder.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Created:</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(singleFolder.created_at).toLocaleString()}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Updated:</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(singleFolder.updated_at).toLocaleString()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {folders && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Response Summary</CardTitle>
              <CardDescription>
                Page {folders.page} of {folders.page_count} • {folders.routine_folders.length} folders loaded
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.routine_folders.map((folder) => (
              <Card
                key={folder.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleGetSingleFolder(folder.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {folder.title}
                  </CardTitle>
                  <CardDescription>Click to view details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">ID:</span>
                      <Badge variant="secondary" className="text-xs">{folder.id}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(folder.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
