import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: connectionError,
        env_check: {
          supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabase_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          resend_api_key: !!process.env.RESEND_API_KEY,
        },
      });
    }

    // Test if email_verification_codes table exists
    const { data: tableTest, error: tableError } = await supabase
      .from("email_verification_codes")
      .select("count")
      .limit(1);

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      tables: {
        profiles: connectionError ? "❌ Not accessible" : "✅ Accessible",
        email_verification_codes: tableError
          ? "❌ Not accessible"
          : "✅ Accessible",
      },
      env_check: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        resend_api_key: !!process.env.RESEND_API_KEY,
      },
      table_error: tableError,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : String(error),
      env_check: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        resend_api_key: !!process.env.RESEND_API_KEY,
      },
    });
  }
}
