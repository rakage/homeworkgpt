"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  createHomeworkRequest,
  getAllSubjects,
  getHomeworkStats,
  createSubject,
} from "@/lib/database-functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "connected" | "error"
  >("checking");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [newSubject, setNewSubject] = useState({ name: "", description: "" });
  const [newRequest, setNewRequest] = useState({
    subject: "",
    question: "",
    difficultyLevel: "beginner" as "beginner" | "intermediate" | "advanced",
  });

  useEffect(() => {
    testConnection();
    loadInitialData();
  }, []);

  const testConnection = async () => {
    try {
      const { error } = await supabase
        .from("subjects")
        .select("count")
        .limit(1);
      if (error) {
        console.error("Connection error:", error);
        setConnectionStatus("error");
      } else {
        setConnectionStatus("connected");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus("error");
    }
  };

  const loadInitialData = async () => {
    try {
      const [subjectsData, statsData] = await Promise.all([
        getAllSubjects(),
        getHomeworkStats(),
      ]);
      setSubjects(subjectsData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubject.name.trim()) return;

    setIsLoading(true);
    try {
      await createSubject(newSubject);
      setNewSubject({ name: "", description: "" });
      await loadInitialData(); // Refresh data
    } catch (error) {
      console.error("Failed to create subject:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.subject || !newRequest.question.trim()) return;

    setIsLoading(true);
    try {
      // For testing, we'll use a dummy user ID
      await createHomeworkRequest({
        userId: "test-user-123",
        ...newRequest,
      });
      setNewRequest({ subject: "", question: "", difficultyLevel: "beginner" });
      await loadInitialData(); // Refresh stats
    } catch (error) {
      console.error("Failed to create homework request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Supabase Integration Test</h1>
        <p className="text-muted-foreground mt-2">
          Testing database connectivity and basic operations
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "error"
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
            />
            <span className="font-medium">
              {connectionStatus === "connected"
                ? "Connected to Supabase"
                : connectionStatus === "error"
                ? "Connection Failed"
                : "Checking Connection..."}
            </span>
          </div>
          {connectionStatus === "error" && (
            <p className="text-sm text-muted-foreground mt-2">
              Make sure your Supabase credentials are configured in .env.local
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subjects Management */}
        <Card>
          <CardHeader>
            <CardTitle>Subjects Management</CardTitle>
            <CardDescription>
              Create and view available subjects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Subject name"
                value={newSubject.name}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, name: e.target.value })
                }
              />
              <Input
                placeholder="Description (optional)"
                value={newSubject.description}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, description: e.target.value })
                }
              />
              <Button
                onClick={handleCreateSubject}
                disabled={isLoading || !newSubject.name.trim()}
                className="w-full"
              >
                {isLoading ? "Creating..." : "Create Subject"}
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">
                Existing Subjects ({subjects.length})
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="p-2 bg-muted rounded text-sm"
                  >
                    <div className="font-medium">{subject.name}</div>
                    {subject.description && (
                      <div className="text-muted-foreground">
                        {subject.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Homework Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Homework Requests</CardTitle>
            <CardDescription>Create test homework requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Select
                value={newRequest.subject}
                onValueChange={(value) =>
                  setNewRequest({ ...newRequest, subject: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Enter your question or homework problem..."
                value={newRequest.question}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, question: e.target.value })
                }
                rows={3}
              />

              <Select
                value={newRequest.difficultyLevel}
                onValueChange={(value: any) =>
                  setNewRequest({ ...newRequest, difficultyLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleCreateRequest}
                disabled={
                  isLoading ||
                  !newRequest.subject ||
                  !newRequest.question.trim()
                }
                className="w-full"
              >
                {isLoading ? "Creating..." : "Create Request"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Database Statistics</CardTitle>
            <CardDescription>
              Current homework request statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.inProgress}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.cancelled}
                </div>
                <div className="text-sm text-muted-foreground">Cancelled</div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <h4 className="font-medium">By Difficulty</h4>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  Beginner: {stats.byDifficulty.beginner}
                </Badge>
                <Badge variant="secondary">
                  Intermediate: {stats.byDifficulty.intermediate}
                </Badge>
                <Badge variant="secondary">
                  Advanced: {stats.byDifficulty.advanced}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>To complete the Supabase setup:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>
              Create a Supabase project at{" "}
              <a
                href="https://supabase.com"
                className="text-blue-600 hover:underline"
              >
                supabase.com
              </a>
            </li>
            <li>Copy your project URL and anon key from the API settings</li>
            <li>Update the .env.local file with your credentials</li>
            <li>
              Create the database tables using the SQL editor in Supabase
              dashboard
            </li>
            <li>Run the migration scripts to set up the schema</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
