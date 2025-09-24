"use client";

import { useState } from "react";
// Note: We don't import Supabase client here since this is just a test UI

export default function TestAuthPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("test@example.com");

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test/database", {
        method: "GET",
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegisterAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          type: "signup",
          userData: {
            email: testEmail,
            password: "testpassword123",
            fullName: "Test User",
          },
        }),
      });
      const data = await response.json();
      setResult(JSON.stringify({ status: response.status, data }, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testEmailOnly = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
        }),
      });
      const data = await response.json();
      setResult(JSON.stringify({ status: response.status, data }, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth System Debug</h1>

      <div className="mb-6">
        <label htmlFor="testEmail" className="block text-sm font-medium mb-2">
          Test Email Address:
        </label>
        <input
          id="testEmail"
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md w-full max-w-md"
          placeholder="Enter your email to test"
        />
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={testDatabaseConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mr-4"
        >
          {loading ? "Testing..." : "Test Database Connection"}
        </button>

        <button
          onClick={testEmailOnly}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 mr-4"
        >
          {loading ? "Testing..." : "Test Email Only"}
        </button>

        <button
          onClick={testRegisterAPI}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Full Register API"}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Result:</h2>
        <pre className="whitespace-pre-wrap text-sm">{result}</pre>
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Environment Check:</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Supabase URL:</strong>{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}
          </div>
          <div>
            <strong>Supabase Anon Key:</strong>{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              ? "✅ Set"
              : "❌ Missing"}
          </div>
        </div>
      </div>
    </div>
  );
}
