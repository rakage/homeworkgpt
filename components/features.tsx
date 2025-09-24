import { Quote, Shield, FileText, ClipboardList, Share2, Clock } from "lucide-react"

export function Features() {
  const features = [
    {
      name: "Citations Mode",
      desc: "Source links & references on demand.",
      icon: Quote,
    },
    {
      name: "Original Writing",
      desc: "Paraphrase suggestions and guidance.",
      icon: Shield,
    },
    {
      name: "Attachment Insights",
      desc: "Parse PDFs, docs, images, CSVs.",
      icon: FileText,
    },
    {
      name: "Study Outputs",
      desc: "Flashcards, quizzes, summaries.",
      icon: ClipboardList,
    },
    {
      name: "Export",
      desc: "Google Docs, Markdown, CSV.",
      icon: Share2,
    },
    {
      name: "History",
      desc: "Saved sessions & pins.",
      icon: Clock,
    },
  ]

  return (
    <section id="features" className="py-12 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground">Built for academic integrity</h2>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.name} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{feature.name}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
