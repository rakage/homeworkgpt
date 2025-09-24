"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Paperclip, Send, Bot } from "lucide-react"

export function HeroSearch() {
  const [query, setQuery] = useState("")
  const [selectedModel, setSelectedModel] = useState("gpt-5")

  const models = [
    { value: "gpt-5", label: "GPT-5", logo: "🤖" },
    { value: "gpt-4.1", label: "GPT-4.1", logo: "🤖" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini", logo: "🤖" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini", logo: "🤖" },
    { value: "deepseek-chat-v3.1", label: "DeepSeek Chat v3.1", logo: "🧠" },
    { value: "llama-3.3-70b-instruct", label: "Llama 3.3 70B", logo: "🦙" },
    { value: "grok-4", label: "Grok-4", logo: "❌" },
    { value: "claude-sonnet-4", label: "Claude Sonnet 4", logo: "🎭" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", logo: "♊" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", logo: "⚡" },
  ]

  const chips = [
    { label: "Attach", icon: Paperclip },
  ]

  return (
    <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 blob-bg-1" />
      <div className="absolute inset-0 blob-bg-2" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-foreground text-balance">
            Study smarter with your friendly AI buddy
          </h1>
          <p className="mt-3 text-lg text-muted-foreground text-pretty">
            Paste a question or drop files to get step-by-step explanations, citations, and study tools.
          </p>

          <div className="mt-10">
            <div className="rounded-3xl bg-white/90 border border-slate-200 shadow-[0_8px_40px_rgba(2,6,23,0.08)] backdrop-blur">
              <div className="flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5">
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Ask anything… e.g., "Explain ANOVA vs. linear regression"'
                  className="flex-1 bg-transparent border-0 outline-none text-base sm:text-lg placeholder:text-slate-400 resize-none min-h-[24px] max-h-32"
                  rows={1}
                />
                <Button
                  size="sm"
                  className="rounded-2xl bg-primary text-white px-4 py-2 font-medium hover:bg-primary/90 focus:ring-4 focus:ring-blue-200"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="px-5 pb-4 sm:px-6 sm:pb-5">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {chips.map((chip) => (
                    <button
                      key={chip.label}
                      className="inline-flex items-center gap-2 rounded-full bg-[#E9F1FF] text-foreground/80 px-3 py-1 text-sm ring-1 ring-slate-200 hover:ring-slate-300 transition-all"
                    >
                      <chip.icon className="h-3 w-3" />
                      {chip.label}
                    </button>
                  ))}
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-44 h-8 text-sm border-slate-200 bg-transparent">
                      <span className="mr-1">{models.find(m => m.value === selectedModel)?.logo}</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex items-center gap-2">
                            <span>{model.logo}</span>
                            <span>{model.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Drop files or click to upload • PDF/DOCX/PNG/JPG/CSV • up to 25MB
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success rounded-full" />
                No plagiarism
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Citations mode
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-accent rounded-full" />
                Free plan available
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
