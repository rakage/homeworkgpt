import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { WriteHuman } from "@/components/write-human";

export default async function WriteHumanPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Write Human</h1>
          <p className="text-gray-600 mt-1">
            Transform AI-generated text into natural, human-like content
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <WriteHuman />
      </main>
    </div>
  );
}
