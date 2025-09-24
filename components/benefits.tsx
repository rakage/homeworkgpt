import { CheckCircle, Shield, FileText, Zap, Smartphone, Sparkles } from "lucide-react";

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

export function Benefits() {
  return (
    <section className="section relative">
      <div className="absolute inset-0 bg-white/30" />
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Content */}
          <div className="animate-fade-in-up">
            <h2 className="mb-8 text-ink font-extrabold tracking-tight">
              Effortlessly Humanize AI Text
            </h2>

            <ul className="space-y-6 mb-8">
              {benefits.map((benefit, index) => (
                <li
                  key={benefit.text}
                  className="flex items-center gap-4 group animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-none w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200 group-hover:scale-110">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-lg font-semibold text-ink">
                    {benefit.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Side - Mobile Preview */}
          <div className="relative animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            {/* iPhone Mockup */}
            <div className="relative mx-auto w-80 h-[640px] animate-float">
              <div className="w-full h-full bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full glass-panel rounded-[2.5rem] overflow-hidden relative">
                  {/* Status bar */}
                  <div className="absolute top-0 left-0 right-0 h-10 bg-gray-50 flex items-center justify-center">
                    <div className="w-24 h-1.5 bg-gray-400 rounded-full"></div>
                  </div>

                  {/* App content */}
                  <div className="pt-14 px-6 h-full bg-page-gradient">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-extrabold text-ink mb-2 tracking-tight">
                        WriteHuman
                      </h3>
                      <p className="text-sm text-muted font-medium">Writing, Perfected.</p>
                    </div>

                    {/* AI Text Input */}
                    <div className="bg-white/90 rounded-2xl p-4 shadow-sm mb-6 border border-white/50">
                      <div className="text-sm font-semibold text-muted mb-3">
                        AI Text Input:
                      </div>
                      <div className="text-sm bg-red-50 p-3 rounded-xl text-red-800 border border-red-200">
                        "The implementation of artificial intelligence in modern
                        business environments has facilitated unprecedented
                        optimization..."
                      </div>
                    </div>

                    {/* Humanized Output */}
                    <div className="bg-white/90 rounded-2xl p-4 shadow-sm mb-6 border border-white/50">
                      <div className="text-sm font-semibold text-muted mb-3">
                        Humanized Output:
                      </div>
                      <div className="text-sm bg-green-50 p-3 rounded-xl text-green-800 border border-green-200">
                        "AI has transformed how businesses operate today,
                        bringing exciting new ways to streamline processes..."
                      </div>
                    </div>

                    {/* Results Badge */}
                    <div
                      className="rounded-2xl p-6 text-center text-white relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-soft) 100%)`,
                      }}
                    >
                      <div className="text-3xl font-extrabold mb-1">0% AI</div>
                      <div className="text-lg font-semibold opacity-90">100% Human</div>
                      
                      {/* Decorative sparkle */}
                      <div className="absolute top-2 right-2">
                        <Sparkles className="w-6 h-6 text-white/60" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating decorative elements */}
            <div
              className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center animate-float"
              style={{ animationDelay: "1s" }}
            >
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>

            <div
              className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-float"
              style={{ animationDelay: "2s" }}
            >
              <Smartphone className="w-8 h-8 text-primary" />
            </div>

            <div
              className="absolute top-1/4 -left-8 w-12 h-12 rounded-full bg-accent/30 animate-float"
              style={{ animationDelay: "3s" }}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
}