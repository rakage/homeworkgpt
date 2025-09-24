"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "./upgrade-modal";
import { ArrowUp, Sparkles } from "lucide-react";

interface UpgradeButtonProps {
  currentTier?: string | null;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export function UpgradeButton({
  currentTier,
  variant = "default",
  size = "default",
  className,
  children,
  showIcon = true,
}: UpgradeButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const defaultContent = (
    <>
      {showIcon && <Sparkles className="mr-2 h-4 w-4" />}
      Upgrade Plan
    </>
  );

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant={variant}
        size={size}
        className={className}
      >
        {children || defaultContent}
      </Button>

      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTier={currentTier}
      />
    </>
  );
}

// Specialized upgrade button for dashboard usage
export function DashboardUpgradeButton({
  currentTier,
  className,
}: {
  currentTier?: string | null;
  className?: string;
}) {
  const [showModal, setShowModal] = useState(false);

  if (currentTier === "plus") {
    return null; // Don't show upgrade button if already on highest tier
  }

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white ${className}`}
      >
        <ArrowUp className="mr-2 h-4 w-4" />
        {currentTier ? "Upgrade Plan" : "Get Premium"}
      </Button>

      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTier={currentTier}
      />
    </>
  );
}

// Specialized upgrade button for usage limits
export function LimitUpgradeButton({
  currentTier,
  message = "Upgrade to get unlimited access",
}: {
  currentTier?: string | null;
  message?: string;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-amber-800">
            Usage Limit Reached
          </h3>
          <p className="text-sm text-amber-700 mt-1">{message}</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Upgrade Now
        </Button>
      </div>

      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTier={currentTier}
      />
    </div>
  );
}
