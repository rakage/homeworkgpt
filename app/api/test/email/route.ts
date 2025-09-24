import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if RESEND_API_KEY exists
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "RESEND_API_KEY not found in environment variables",
        hint: "Add RESEND_API_KEY to your .env.local file",
      });
    }

    console.log("Sending test email to:", email);
    console.log(
      "Using API key:",
      process.env.RESEND_API_KEY ? "✅ Set" : "❌ Missing"
    );

    const emailResult = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>", // Resend's test domain
      to: email,
      subject: "Test Email from Homework Help GPT",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Test Email</h1>
          <p>This is a test email to verify that your email service is working correctly.</p>
          <p>If you received this email, your Resend integration is working! 🎉</p>
          <p>Test code: <strong>123456</strong></p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResult);

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      emailResult,
      env_check: {
        resend_api_key: !!process.env.RESEND_API_KEY,
      },
    });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to send test email",
      details: error instanceof Error ? error.message : String(error),
      env_check: {
        resend_api_key: !!process.env.RESEND_API_KEY,
      },
    });
  }
}
