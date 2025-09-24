"use client"

import { useState } from "react"

export function Subjects() {
  const [activeFilter, setActiveFilter] = useState("Math")

  const filters = ["Math", "Stats", "CS", "Biology", "Psychology", "Economics", "Literature"]

  const cards = [
    {
      title: "Math & Stats",
      bullets: ["Derivations", "ANOVA/GLM", "Proof hints"],
    },
    {
      title: "Computer Science",
      bullets: ["Explain code", "Time complexity", "Bug hints"],
    },
    {
      title: "Humanities",
      bullets: ["Thesis outlines", "Citation styles", "Close reading"],
    },
  ]

  return (
    <section id="subjects" className="py-12 sm:py-16 lg:py-24 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground">Popular subjects</h2>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === filter ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-slate-100"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.title} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
              <h3 className="font-heading text-xl font-semibold text-foreground mb-4">{card.title}</h3>
              <ul className="space-y-2">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
