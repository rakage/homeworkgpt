import { CheckCircle, Smartphone, Shield, Zap, FileText } from "lucide-react";

const benefits = [
  {
    text: "Humanize AI Text",
    icon: CheckCircle,
  },
  {
    text: "Built-in AI Detector",
    icon: Shield,
  },
  {
    text: "Paraphrase AI",
    icon: FileText,
  },
  {
    text: "Protect Authenticity",
    icon: Zap,
  },
  {
    text: "Improve Writing",
    icon: Smartphone,
  },
];

export function MobilePreview() {
  return (
    <section className="section bg-white/50">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="mb-8 text-ink">Effortlessly Humanize AI Text</h2>

            <ul className="space-y-6 mb-8">
              {benefits.map((benefit) => (
                <li
                  key={benefit.text}
                  className="flex items-center gap-4 group"
                >
                  <div className="flex-none w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-lg font-medium text-ink">
                    {benefit.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative lg:order-first">
            {/* iPhone Mockup */}
            <div className="relative mx-auto w-64 h-[520px] animate-float">
              <div className="w-full h-full bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                <div className="w-full h-full glass-panel rounded-[2rem] overflow-hidden relative">
                  {/* Status bar */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-gray-50 flex items-center justify-center">
                    <div className="w-20 h-1 bg-gray-400 rounded-full"></div>
                  </div>

                  {/* App content */}
                  <div className="pt-12 px-4 h-full bg-page-gradient">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-ink mb-2">
                        WriteHuman
                      </h3>
                      <p className="text-xs text-muted">Writing, Perfected.</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm mb-4">
                      <div className="text-xs text-muted mb-2">
                        AI Text Input:
                      </div>
                      <div className="text-xs bg-red-50 p-2 rounded text-red-800 border border-red-200">
                        "The implementation of artificial intelligence in modern
                        business environments has facilitated unprecedented
                        optimization..."
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm mb-4">
                      <div className="text-xs text-muted mb-2">
                        Humanized Output:
                      </div>
                      <div className="text-xs bg-green-50 p-2 rounded text-green-800 border border-green-200">
                        "AI has transformed how businesses operate today,
                        bringing exciting new ways to streamline processes..."
                      </div>
                    </div>

                    <div
                      className="rounded-lg p-4 text-center text-white"
                      style={{
                        background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-soft) 100%)`,
                      }}
                    >
                      <div className="text-lg font-bold">0% AI</div>
                      <div className="text-sm opacity-80">100% Human</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div
              className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center animate-float"
              style={{ animationDelay: "1s" }}
            >
              <CheckCircle className="w-6 h-6 text-accent" />
            </div>

            <div
              className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-float"
              style={{ animationDelay: "2s" }}
            >
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
