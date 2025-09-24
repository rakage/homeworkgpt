import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="section relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary-soft/10" />
        <div className="blob-top-left opacity-20" />
        <div className="blob-bottom-right opacity-20" />
      </div>

      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="card p-16 relative overflow-hidden animate-fade-in-up">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-primary/5"></div>

            <div className="relative">
              <div className="inline-flex items-center gap-3 glass-panel rounded-full px-6 py-3 mb-8">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-base font-semibold text-primary">
                  Start Humanizing Today
                </span>
              </div>

              <h2 className="mb-8 text-ink font-extrabold tracking-tight">
                Humanize AI and Create Quality Writing
              </h2>

              <p className="text-xl text-muted mb-12 max-w-3xl mx-auto leading-relaxed">
                Paste your AI text and get best-in-class humanized results.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <Button className="btn-primary text-xl px-12 py-5 flex items-center gap-3 font-bold shadow-lg hover:shadow-xl">
                  Create your free account
                  <ArrowRight className="w-6 h-6" />
                </Button>
              </div>

              {/* Secondary links */}
              <div className="flex justify-center gap-8 text-base mb-12">
                <a
                  href="#detector"
                  className="text-muted hover:text-primary transition-colors font-medium"
                >
                  AI Detector
                </a>
                <a
                  href="#wordcounter"
                  className="text-muted hover:text-primary transition-colors font-medium"
                >
                  Word Counter
                </a>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-border/20">
                <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                  <div className="text-4xl font-extrabold text-ink mb-2">0%</div>
                  <div className="text-base text-muted font-semibold">AI Detection</div>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                  <div className="text-4xl font-extrabold text-ink mb-2">50K+</div>
                  <div className="text-base text-muted font-semibold">Happy Users</div>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                  <div className="text-4xl font-extrabold text-ink mb-2">99%</div>
                  <div className="text-base text-muted font-semibold">Accuracy Rate</div>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                  <div className="text-4xl font-extrabold text-ink mb-2">24/7</div>
                  <div className="text-base text-muted font-semibold">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
