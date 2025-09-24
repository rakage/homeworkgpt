"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle } from "lucide-react";

interface FixStatusButtonProps {
  currentStatus?: string | null;
  onStatusFixed?: () => void;
}

export function FixStatusButton({
  currentStatus,
  onStatusFixed,
}: FixStatusButtonProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fixSubscriptionStatus = async () => {
    try {
      setIsFixing(true);
      setMessage(null);

      const response = await fetch("/api/subscription/fix-status", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix subscription status");
      }

      setMessage(data.message);

      // Call the callback to refresh parent component
      if (onStatusFixed) {
        setTimeout(() => {
          onStatusFixed();
        }, 1000);
      }
    } catch (error) {
      console.error("Fix status error:", error);
      setMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsFixing(false);
    }
  };

  // Only show button if status is incomplete
  if (currentStatus === "active") {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={fixSubscriptionStatus}
        disabled={isFixing}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {isFixing ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="mr-2 h-4 w-4" />
        )}
        {isFixing ? "Fixing Status..." : "Fix Subscription Status"}
      </Button>

      {message && (
        <p
          className={`text-sm ${
            message.includes("error") || message.includes("Failed")
              ? "text-red-600"
              : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
