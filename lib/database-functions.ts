import { supabase, supabaseAdmin } from "./supabase";
import { Database } from "./database.types";

type Tables = Database["public"]["Tables"];
type HomeworkRequest = Tables["homework_requests"]["Row"];
type User = Tables["users"]["Row"];
type Subject = Tables["subjects"]["Row"];

// User functions
export async function createUser(userData: {
  email: string;
  fullName?: string;
  avatarUrl?: string;
}) {
  const { data, error } = await supabase
    .from("users")
    .insert({
      email: userData.email,
      full_name: userData.fullName,
      avatar_url: userData.avatarUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// Homework request functions
export async function createHomeworkRequest(requestData: {
  userId: string;
  subject: string;
  question: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
}) {
  const { data, error } = await supabase
    .from("homework_requests")
    .insert({
      user_id: requestData.userId,
      subject: requestData.subject,
      question: requestData.question,
      difficulty_level: requestData.difficultyLevel,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getHomeworkRequestsByUser(userId: string) {
  const { data, error } = await supabase
    .from("homework_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateHomeworkRequestStatus(
  id: string,
  status: "pending" | "in_progress" | "completed" | "cancelled",
  solution?: string
) {
  const updateData: any = { status };
  if (solution) updateData.solution = solution;

  const { data, error } = await supabase
    .from("homework_requests")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Subject functions
export async function getAllSubjects() {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function createSubject(subjectData: {
  name: string;
  description?: string;
  icon?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("subjects")
    .insert(subjectData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Analytics functions
export async function getHomeworkStats(userId?: string) {
  let query = supabase
    .from("homework_requests")
    .select("status, difficulty_level, created_at");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const stats = {
    total: data.length,
    pending: data.filter((r) => r.status === "pending").length,
    inProgress: data.filter((r) => r.status === "in_progress").length,
    completed: data.filter((r) => r.status === "completed").length,
    cancelled: data.filter((r) => r.status === "cancelled").length,
    byDifficulty: {
      beginner: data.filter((r) => r.difficulty_level === "beginner").length,
      intermediate: data.filter((r) => r.difficulty_level === "intermediate")
        .length,
      advanced: data.filter((r) => r.difficulty_level === "advanced").length,
    },
  };

  return stats;
}

// Real-time subscriptions
export function subscribeToHomeworkRequests(
  userId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel("homework_requests")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "homework_requests",
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

export function unsubscribeFromHomeworkRequests(subscription: any) {
  supabase.removeChannel(subscription);
}
