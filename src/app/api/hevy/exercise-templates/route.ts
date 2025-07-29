import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "../lib/types";
import { hevyServerClient } from "../lib/hevy-server-client";
import { HevyExerciseTemplatesResponse } from "@/lib/hevy/types/exercise-templates";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");

    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (pageSize) params.append("pageSize", pageSize);

    const queryString = params.toString();
    const url = queryString
      ? `/exercise_templates?${queryString}`
      : "/exercise_templates";

    const data = await hevyServerClient.get<HevyExerciseTemplatesResponse>(url);

    console.log({ data });
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: apiError.message || "Failed to fetch exercise templates" },
      { status: apiError.status || 500 }
    );
  }
}
