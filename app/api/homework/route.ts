import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { HomeworkService } from "@/lib/services/homework.service";
// import { DifficultyLevel } from "@/lib/generated/prisma";
import { DifficultyLevel } from "@prisma/client";

// GET /api/homework - Get homework requests for authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get current user from Supabase auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get homework requests using Prisma service
    const homeworkRequests = await HomeworkService.getHomeworkRequests(user.id);

    return NextResponse.json({
      homework: homeworkRequests,
      count: homeworkRequests.length,
    });
  } catch (error) {
    console.error("Get homework requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch homework requests" },
      { status: 500 }
    );
  }
}

// POST /api/homework - Create new homework request
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get current user from Supabase auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const { subject, question, difficultyLevel } = await request.json();

    if (!subject || !question) {
      return NextResponse.json(
        { error: "Subject and question are required" },
        { status: 400 }
      );
    }

    // Validate difficulty level
    const validDifficultyLevels = Object.values(DifficultyLevel);
    const difficulty =
      difficultyLevel && validDifficultyLevels.includes(difficultyLevel)
        ? difficultyLevel
        : DifficultyLevel.beginner;

    // Create homework request using Prisma service
    const homeworkRequest = await HomeworkService.createHomeworkRequest({
      userId: user.id,
      subject,
      question,
      difficultyLevel: difficulty,
    });

    return NextResponse.json({
      homework: homeworkRequest,
      message: "Homework request created successfully",
    });
  } catch (error) {
    console.error("Create homework request error:", error);
    return NextResponse.json(
      { error: "Failed to create homework request" },
      { status: 500 }
    );
  }
}
