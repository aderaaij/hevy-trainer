import { WorkoutSyncService } from "./workout-sync";
import { RoutineSyncService } from "./routine-sync";
import { RoutineFolderSyncService } from "./routine-folder-sync";
import { ExerciseSyncService } from "./exercise-sync";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export interface FullSyncResult {
  workouts: { synced: number; failed: number };
  routines: { synced: number; failed: number };
  routineFolders: { synced: number; failed: number };
  exercises: { synced: number; failed: number };
  totalSynced: number;
  totalFailed: number;
  duration: number;
}

export class HevySyncService {
  private userId: string;
  private workoutSync: WorkoutSyncService;
  private routineSync: RoutineSyncService;
  private routineFolderSync: RoutineFolderSyncService;
  private exerciseSync: ExerciseSyncService;

  constructor(userId: string) {
    this.userId = userId;
    this.workoutSync = new WorkoutSyncService(userId);
    this.routineSync = new RoutineSyncService(userId);
    this.routineFolderSync = new RoutineFolderSyncService(userId);
    this.exerciseSync = new ExerciseSyncService(userId);
  }

  /**
   * Perform a full sync of all data
   */
  async fullSync(): Promise<FullSyncResult> {
    const startTime = Date.now();

    // Create master sync status
    const masterSync = await prisma.syncStatus.create({
      data: {
        userId: this.userId,
        syncType: "full",
        status: "in_progress",
      },
    });

    const result: FullSyncResult = {
      workouts: { synced: 0, failed: 0 },
      routines: { synced: 0, failed: 0 },
      routineFolders: { synced: 0, failed: 0 },
      exercises: { synced: 0, failed: 0 },
      totalSynced: 0,
      totalFailed: 0,
      duration: 0,
    };

    try {
      // Sync exercises first (needed for workouts and routines)
      const exerciseResult = await this.exerciseSync.syncAllExercises();
      result.exercises = exerciseResult;

      // Sync routine folders (needed for routines)
      const folderResult = await this.routineFolderSync.syncAllRoutineFolders();
      result.routineFolders = folderResult;

      // Sync routines
      const routineResult = await this.routineSync.syncAllRoutines();
      result.routines = routineResult;

      // Sync workouts (most data intensive, do last)
      const workoutResult = await this.workoutSync.syncAllWorkouts();
      result.workouts = workoutResult;

      // Calculate totals
      result.totalSynced =
        result.exercises.synced +
        result.routineFolders.synced +
        result.routines.synced +
        result.workouts.synced;

      result.totalFailed =
        result.exercises.failed +
        result.routineFolders.failed +
        result.routines.failed +
        result.workouts.failed;

      result.duration = Date.now() - startTime;

      // Update master sync status
      await prisma.syncStatus.update({
        where: { id: masterSync.id },
        data: {
          status:
            result.totalFailed === 0 ? "completed" : "completed_with_errors",
          completedAt: new Date(),
          itemsSynced: result.totalSynced,
          totalItems: result.totalSynced + result.totalFailed,
          errorMessage:
            result.totalFailed > 0
              ? `Failed to sync ${result.totalFailed} items`
              : null,
          metadata: result,
        },
      });
    } catch (error) {
      // Update master sync status to failed
      await prisma.syncStatus.update({
        where: { id: masterSync.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw error;
    }

    return result;
  }

  /**
   * Perform an incremental sync (only new/updated data)
   */
  async incrementalSync(): Promise<{ workouts: unknown }> {
    // For now, only workouts support incremental sync
    const workoutResult = await this.workoutSync.syncIncrementalWorkouts();

    return {
      workouts: workoutResult,
    };
  }

  /**
   * Get overall sync status
   */
  async getOverallSyncStatus() {
    const workoutStatus = await this.workoutSync.getSyncStatus();
    const routineStatus = await this.routineSync.getSyncStatus();
    const folderStatus = await this.routineFolderSync.getSyncStatus();
    const exerciseStatus = await this.exerciseSync.getSyncStatus();

    // Get most recent full sync
    const lastFullSync = await prisma.syncStatus.findFirst({
      where: {
        userId: this.userId,
        syncType: "full",
      },
      orderBy: { startedAt: "desc" },
    });

    // Determine if data is stale (more than 7 days old)
    const lastSyncDate = workoutStatus.lastSyncedAt || new Date(0);
    const daysSinceSync = Math.floor(
      (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isStale = daysSinceSync > 7;

    return {
      workouts: workoutStatus,
      routines: routineStatus,
      routineFolders: folderStatus,
      exercises: exerciseStatus,
      lastFullSync,
      isStale,
      daysSinceSync,
      recommendation: isStale
        ? "Your data is more than 7 days old. Consider running a sync."
        : "Your data is up to date.",
    };
  }

  /**
   * Check if a sync is currently in progress
   */
  async isSyncInProgress(): Promise<boolean> {
    const activeSync = await prisma.syncStatus.findFirst({
      where: {
        userId: this.userId,
        status: { in: ["pending", "in_progress"] },
      },
    });

    return !!activeSync;
  }
}
