import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { EmailVerificationService } from "@/lib/services/email-verification.service";
// import { VerificationCodeType } from "@/lib/generated/prisma";
import { VerificationCodeType } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const limit = rateLimitMap.get(key);

  if (!limit) {
    rateLimitMap.set(key, { count: 1, lastReset: now });
    return true;
  }

  // Reset count if it's been more than an hour
  if (now - limit.lastReset > 3600000) {
    rateLimitMap.set(key, { count: 1, lastReset: now });
    return true;
  }

  // Check if under limit (3 codes per hour)
  if (limit.count < 3) {
    limit.count++;
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const { email, type, userData } = await request.json();

    if (!email || !type) {
      return NextResponse.json(
        { error: "Email and type are required" },
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

    // Check rate limiting
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        {
          error:
            "Too many verification codes requested. Please try again in an hour.",
        },
        { status: 429 }
      );
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Sanitize user data (remove passwords completely - we'll handle them at verification)
    const sanitizedUserData =
      type === "signup" && userData
        ? { ...userData, password: undefined } // Remove password completely
        : null;

    // Store verification code in database using Prisma
    try {
      await EmailVerificationService.createVerificationCode({
        email: email.toLowerCase(),
        code,
        type: type as VerificationCodeType,
        expiresAt,
        userData: sanitizedUserData,
      });
    } catch (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to store verification code" },
        { status: 500 }
      );
    }

    // Send email with verification code
    const emailContent = getEmailContent(type, code);

    try {
      const emailResult = await resend.emails.send({
        from: "LearnWithPeni <noreply@verify.learnwithpeni.com>", // Resend's test domain
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
      console.log("Email sent successfully:", emailResult);
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Check if it's a Resend API key issue
      if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY is not set in environment variables");
      }
      // Don't return error here - code is still valid even if email fails
      // In production, you might want to queue the email for retry
    }

    return NextResponse.json({
      message: "Verification code sent successfully",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Send verification code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getEmailContent(
  type: string,
  code: string
): { subject: string; html: string } {
  const baseStyles = `
    <style>
      .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
      .code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; letter-spacing: 4px; }
      .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #6c757d; font-size: 14px; }
    </style>
  `;

  switch (type) {
    case "signup":
      return {
        subject: "Verify your email address",
        html: `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>Welcome to Homework Help GPT!</h1>
            </div>
            <div class="content">
              <p>Thank you for signing up! Please use the verification code below to complete your registration:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        `,
      };

    case "password_reset":
      return {
        subject: "Reset your password",
        html: `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>You requested to reset your password. Please use the verification code below:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: "Verification code",
        html: `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>Verification Code</h1>
            </div>
            <div class="content">
              <p>Your verification code is:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 10 minutes.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        `,
      };
  }
}
