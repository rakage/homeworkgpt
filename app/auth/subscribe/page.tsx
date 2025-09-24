import { PricingCards } from "@/components/subscription/pricing-cards";

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome! Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Your account has been created successfully. Select a subscription
            plan to get started.
          </p>
        </div>

        <PricingCards />

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            You can change or cancel your plan at any time from your account
            settings.
          </p>
        </div>
      </div>
    </div>
  );
}
