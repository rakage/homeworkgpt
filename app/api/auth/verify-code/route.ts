import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { EmailVerificationService } from "@/lib/services/email-verification.service";
// import { VerificationCodeType } from "@/lib/generated/prisma";
import { VerificationCodeType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { email, code, type, password } = await request.json();

    if (!email || !code || !type) {
      return NextResponse.json(
        { error: "Email, code, and type are required" },
        { status: 400 }
      );
    }

    const validTypes = Object.values(VerificationCodeType);
    if (!validTypes.includes(type as VerificationCodeType)) {
      return NextResponse.json(
        { error: "Invalid verification type" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find valid verification code using Prisma
    const verificationResults =
      await EmailVerificationService.getVerificationCode(
        email,
        code,
        type as VerificationCodeType
      );

    // Raw query returns an array, get the first result
    const verificationData = Array.isArray(verificationResults)
      ? verificationResults[0]
      : null;

    if (!verificationData) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Mark code as used
    await EmailVerificationService.markCodeAsUsed(verificationData.id);

    if (type === "signup") {
      // Create user account
      const userData = verificationData.user_data;

      if (!userData || !password) {
        return NextResponse.json(
          { error: "User data or password not found" },
          { status: 400 }
        );
      }

      // Create user with Supabase auth (let Supabase handle password hashing)
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: email.toLowerCase(),
          password: password, // Use the original password - Supabase will hash it
          email_confirm: true, // Mark email as confirmed
          user_metadata: {
            full_name: userData.fullName,
          },
        });

      if (authError) {
        console.error("User creation error:", authError);
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 }
        );
      }

      // The user profile will be created automatically via the database trigger

      return NextResponse.json({
        message: "Account created successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      });
    } else if (type === "password_reset") {
      // Generate a temporary token for password reset
      const resetToken = generateResetToken();

      // Store reset token (you might want a separate table for this)
      await supabase.from("email_verification_codes").insert({
        email: email.toLowerCase(),
        code: resetToken,
        type: "reset_token",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      });

      return NextResponse.json({
        message: "Code verified successfully",
        token: resetToken,
      });
    }

    return NextResponse.json({
      message: "Code verified successfully",
    });
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateResetToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
