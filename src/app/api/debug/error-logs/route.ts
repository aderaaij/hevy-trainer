import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const resolved = searchParams.get("resolved");

    // Build filter conditions
    const where: {
      type?: string;
      isResolved?: boolean;
    } = {};
    if (type) where.type = type;
    if (resolved !== null) {
      where.isResolved = resolved === "true";
    }

    // Get error logs
    const errorLogs = await prisma.errorLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.errorLog.count({ where });

    return NextResponse.json({
      success: true,
      data: errorLogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching error logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch error logs" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isResolved } = body;

    if (!id || typeof isResolved !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: id, isResolved" },
        { status: 400 }
      );
    }

    // Update error log
    const updatedLog = await prisma.errorLog.update({
      where: { id },
      data: {
        isResolved,
        resolvedAt: isResolved ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedLog,
    });
  } catch (error) {
    console.error("Error updating error log:", error);
    return NextResponse.json(
      { error: "Failed to update error log" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}