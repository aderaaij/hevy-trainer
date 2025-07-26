-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "age" INTEGER,
    "weight" DOUBLE PRECISION,
    "trainingFrequency" INTEGER,
    "focusAreas" TEXT[],
    "injuries" TEXT[],
    "experienceLevel" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imported_workouts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hevy_workout_id" TEXT NOT NULL,
    "workout_data" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imported_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_routines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "routine_data" JSONB NOT NULL,
    "ai_context" JSONB,
    "hevy_routine_id" TEXT,
    "exported_to_hevy" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_analyses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "analysis_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "imported_workouts_hevy_workout_id_key" ON "imported_workouts"("hevy_workout_id");

-- CreateIndex
CREATE INDEX "imported_workouts_user_id_performed_at_idx" ON "imported_workouts"("user_id", "performed_at");

-- CreateIndex
CREATE INDEX "generated_routines_user_id_created_at_idx" ON "generated_routines"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "training_analyses_user_id_period_start_idx" ON "training_analyses"("user_id", "period_start");

-- AddForeignKey
ALTER TABLE "imported_workouts" ADD CONSTRAINT "imported_workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_routines" ADD CONSTRAINT "generated_routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_analyses" ADD CONSTRAINT "training_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
