import { Sparkles, Shield, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";

export function ValueProposition() {
  return (
    <section className="relative">
      {/* Background gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8f7ff] via-[#fcf9ff] to-[#fdf2ff]" />
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/20" />
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
      <div className="container relative z-10 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="mb-6 text-ink">
              Authentic, human-like scores on leading AI detectors.
            </h2>

            <p className="text-xl text-muted mb-8">
              Produce genuine, human-sounding text in seconds while maintaining
              transparency about AI assistance.
            </p>

            <Button className="btn-primary">Try WriteHuman Now</Button>
          </div>

          <div className="text-center relative">
            {/* Large 0% AI Badge */}
            <div className="relative inline-block">
              <div
                className="glass-panel rounded-full p-12 border-4 transition-all duration-500 hover:scale-105"
                style={{ borderColor: "var(--primary-soft)" }}
              >
                <div className="text-8xl font-bold text-ink mb-4">0%</div>
                <div className="text-2xl font-semibold text-primary">
                  AI Detected
                </div>
              </div>

              {/* Sparkle decorations */}
              <div className="absolute -top-6 -right-6 animate-float">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
              </div>

              <div
                className="absolute -bottom-6 -left-6 animate-float"
                style={{ animationDelay: "1s" }}
              >
                <div className="w-10 h-10 rounded-full bg-primary-soft/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div
                className="absolute top-6 -left-8 animate-float"
                style={{ animationDelay: "2s" }}
              >
                <div className="w-8 h-8 rounded-full bg-accent/30"></div>
              </div>
            </div>

            {/* Supporting badges */}
            <div className="flex justify-center gap-6 mt-12">
              <div className="card text-center min-w-0">
                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-ink">100%</div>
                <div className="text-sm text-muted whitespace-nowrap">
                  Human Score
                </div>
              </div>

              <div className="card text-center min-w-0">
                <CheckCircle className="w-8 h-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-ink">99%</div>
                <div className="text-sm text-muted whitespace-nowrap">
                  Accuracy
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
