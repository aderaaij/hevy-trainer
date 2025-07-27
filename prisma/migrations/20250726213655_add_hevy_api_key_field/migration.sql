-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "hevy_api_key" TEXT,
ADD COLUMN     "last_hevy_sync" TIMESTAMP(3);
