"use client";

import { useState } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { VerificationForm } from "@/components/auth/verification-form";

export default function RegisterPage() {
  const [step, setStep] = useState<"register" | "verify">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegistrationSuccess = (
    userEmail: string,
    userPassword: string
  ) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setStep("verify");
  };

  const handleVerificationSuccess = () => {
    // Redirect will be handled by the VerificationForm component
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {step === "register" ? (
        <RegisterForm onSuccess={handleRegistrationSuccess} />
      ) : (
        <VerificationForm
          email={email}
          type="signup"
          password={password}
          onSuccess={handleVerificationSuccess}
        />
      )}
    </div>
  );
}
