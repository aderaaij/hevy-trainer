import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hevyServerClient } from "@/app/api/hevy/lib/hevy-server-client";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tests: Record<string, any> = {};

    // Test routine folders without pagination
    try {
      const response = await hevyServerClient.get("/routine_folders");
      tests.routine_folders_no_params = {
        status: "success",
        data: response,
      };
    } catch (error: unknown) {
      tests.routine_folders_no_params = {
        status: "error",
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: (error as any)?.status || 500,
        },
      };
    }

    // Test exercises without pagination
    try {
      const response = await hevyServerClient.get("/exercise_templates");
      tests.exercise_templates_no_params = {
        status: "success",
        data: response,
      };
    } catch (error: unknown) {
      tests.exercise_templates_no_params = {
        status: "error",
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: (error as any)?.status || 500,
        },
      };
    }

    // Test exercises with different pagination
    try {
      const response = await hevyServerClient.get(
        "/exercise_templates?page=1&pageSize=10"
      );
      tests.exercise_templates_page_1_size_10 = {
        status: "success",
        data: response,
      };
    } catch (error: unknown) {
      tests.exercise_templates_page_1_size_10 = {
        status: "error",
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: (error as any)?.status || 500,
        },
      };
    }

    return NextResponse.json({
      success: true,
      tests,
    });
  } catch (error) {
    console.error("Simple test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to test" },
      { status: 500 }
    );
  }
}
