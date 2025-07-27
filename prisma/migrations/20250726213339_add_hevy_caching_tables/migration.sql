-- AlterTable
ALTER TABLE "imported_workouts" ADD COLUMN     "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "imported_routines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hevy_routine_id" TEXT NOT NULL,
    "routine_data" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "folder_id" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imported_routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imported_exercise_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hevy_exercise_id" TEXT NOT NULL,
    "exercise_template_data" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "muscle_group" TEXT,
    "exercise_type" TEXT NOT NULL,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imported_exercise_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_status" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sync_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "items_synced" INTEGER NOT NULL DEFAULT 0,
    "total_items" INTEGER,
    "error_message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "sync_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "imported_routines_hevy_routine_id_key" ON "imported_routines"("hevy_routine_id");

-- CreateIndex
CREATE INDEX "imported_routines_user_id_name_idx" ON "imported_routines"("user_id", "name");

-- CreateIndex
CREATE INDEX "imported_routines_user_id_last_synced_at_idx" ON "imported_routines"("user_id", "last_synced_at");

-- CreateIndex
CREATE UNIQUE INDEX "imported_exercise_templates_hevy_exercise_id_key" ON "imported_exercise_templates"("hevy_exercise_id");

-- CreateIndex
CREATE INDEX "imported_exercise_templates_user_id_name_idx" ON "imported_exercise_templates"("user_id", "name");

-- CreateIndex
CREATE INDEX "imported_exercise_templates_user_id_muscle_group_idx" ON "imported_exercise_templates"("user_id", "muscle_group");

-- CreateIndex
CREATE INDEX "sync_status_user_id_sync_type_started_at_idx" ON "sync_status"("user_id", "sync_type", "started_at");

-- CreateIndex
CREATE INDEX "imported_workouts_user_id_last_synced_at_idx" ON "imported_workouts"("user_id", "last_synced_at");

-- AddForeignKey
ALTER TABLE "imported_routines" ADD CONSTRAINT "imported_routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imported_exercise_templates" ADD CONSTRAINT "imported_exercise_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_status" ADD CONSTRAINT "sync_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
