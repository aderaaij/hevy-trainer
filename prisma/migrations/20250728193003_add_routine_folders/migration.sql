-- CreateTable
CREATE TABLE "imported_routine_folders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hevy_folder_id" TEXT NOT NULL,
    "folder_data" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imported_routine_folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "imported_routine_folders_hevy_folder_id_key" ON "imported_routine_folders"("hevy_folder_id");

-- CreateIndex
CREATE INDEX "imported_routine_folders_user_id_name_idx" ON "imported_routine_folders"("user_id", "name");

-- AddForeignKey
ALTER TABLE "imported_routines" ADD CONSTRAINT "imported_routines_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "imported_routine_folders"("hevy_folder_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imported_routine_folders" ADD CONSTRAINT "imported_routine_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
