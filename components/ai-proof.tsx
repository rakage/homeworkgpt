import { Sparkles, Shield, CheckCircle, Star } from "lucide-react";
import { Button } from "./ui/button";

export function AIProof() {
  return (
    <section className="section">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Content */}
          <div className="animate-fade-in-up">
            <h2 className="mb-6 text-ink font-extrabold tracking-tight">
              Authentic, human-like scores on leading AI detectors.
            </h2>

            <p className="text-xl text-muted mb-8 leading-relaxed">
              Produce genuine, human-sounding text in seconds while maintaining
              transparency about AI assistance.
            </p>

            <Button className="btn-primary px-8 py-3 text-lg font-semibold">
              Try WriteHuman Now
            </Button>
          </div>

          {/* Right Side - Large 0% AI Illustration */}
          <div className="text-center relative animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {/* Main 0% AI Circle */}
            <div className="relative inline-block">
              <div
                className="glass-panel rounded-full p-16 border-4 transition-all duration-500 hover:scale-105 relative overflow-hidden"
                style={{ borderColor: "var(--primary-soft)" }}
              >
                {/* Background gradient overlay */}
                <div 
                  className="absolute inset-0 rounded-full opacity-5"
                  style={{
                    background: `linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)`,
                  }}
                />
                
                <div className="relative z-10">
                  <div className="text-9xl font-extrabold text-ink mb-4 tracking-tight">0%</div>
                  <div className="text-3xl font-bold text-primary tracking-tight">
                    AI Detected
                  </div>
                </div>
              </div>

              {/* Floating Sparkle Decorations */}
              <div className="absolute -top-8 -right-8 animate-float">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-accent" />
                </div>
              </div>

              <div
                className="absolute -bottom-8 -left-8 animate-float"
                style={{ animationDelay: "1s" }}
              >
                <div className="w-14 h-14 rounded-full bg-primary-soft/20 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
              </div>

              <div
                className="absolute top-8 -left-12 animate-float"
                style={{ animationDelay: "2s" }}
              >
                <div className="w-12 h-12 rounded-full bg-accent/30 shadow-lg"></div>
              </div>

              <div
                className="absolute -top-4 left-1/3 animate-float"
                style={{ animationDelay: "3s" }}
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-lg">
                  <Star className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>

            {/* Supporting Stats Cards */}
            <div className="flex justify-center gap-6 mt-16">
              <div className="card p-6 text-center min-w-0 hover:scale-105 transition-transform duration-200">
                <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-ink mb-1">100%</div>
                <div className="text-sm text-muted font-semibold whitespace-nowrap">
                  Human Score
                </div>
              </div>

              <div className="card p-6 text-center min-w-0 hover:scale-105 transition-transform duration-200">
                <CheckCircle className="w-10 h-10 text-accent mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-ink mb-1">99%</div>
                <div className="text-sm text-muted font-semibold whitespace-nowrap">
                  Accuracy Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}