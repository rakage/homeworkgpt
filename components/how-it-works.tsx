import { Copy, ClipboardPaste, Wand2 } from "lucide-react";

const steps = [
  {
    num: 1,
    title: "Copy AI-generated text",
    desc: "Works with ChatGPT, Claude, Gemini, DeepSeek, and more.",
    icon: Copy,
  },
  {
    num: 2,
    title: "Paste into WriteHuman",
    desc: "We refine and transform content for readability and engagement.",
    icon: ClipboardPaste,
  },
  {
    num: 3,
    title: "Click Write Human",
    desc: "Get human-like tone tested on popular AI detectors.",
    icon: Wand2,
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-20 md:py-28 -mt-32">
      {/* Continuous gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#fdf2ff] via-[#fcf9ff] to-[#f8f7ff]" />
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/20" />
        {/* Noise texture for consistency */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
      <div className="container relative z-10 pt-32">
        <div className="text-center mb-16">
          <h2 className="mb-6 text-ink font-extrabold tracking-tight">
            Humanize AI text in three simple steps:
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={step.num}
              className="card text-center group p-8 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative mb-6">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-xl transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-soft) 100%)`,
                  }}
                >
                  {step.num}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <step.icon className="w-4 h-4 text-accent" />
                </div>
              </div>

              <h3 className="text-xl font-extrabold mb-4 text-ink tracking-tight">
                {step.title}
              </h3>

              <p className="text-muted leading-relaxed text-base">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
