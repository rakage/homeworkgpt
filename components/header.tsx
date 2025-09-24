"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";

const navigation = [
  { label: "AI Detector", href: "#detector" },
  { label: "Affiliates", href: "#affiliates" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "#blog" },
];

export function Header() {
  const [scrollY, setScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateScroll = () => setScrollY(window.scrollY || 0);
    updateScroll();

    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", scrollListener, { passive: true });
    return () => window.removeEventListener("scroll", scrollListener);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 glass-transition header-optimize`}
      style={{
        // Clamp values for smooth transition without hard edges
        backgroundColor: `rgba(255,255,255,${Math.min(0.85, Math.max(0, scrollY / 160))})`,
        backdropFilter: `blur(${Math.min(18, scrollY / 12)}px) saturate(1.8)` ,
        WebkitBackdropFilter: `blur(${Math.min(18, scrollY / 12)}px) saturate(1.8)`,
        borderBottom: `1px solid rgba(255,255,255,${Math.min(0.35, scrollY / 400)})`,
        boxShadow: scrollY > 8 ? '0 8px 24px rgba(17, 17, 26, 0.08)' : 'none',
      }}
    >
      <nav className="container flex h-16 items-center justify-between">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="text-2xl font-extrabold text-ink tracking-tight">
              WriteHuman
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-ink"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-semibold text-ink/80 hover:text-primary transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          <Button variant="ghost" className="btn-ghost">
            Log in
          </Button>
          <Button className="btn-primary">Sign Up</Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden glass-transition"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${Math.min(0.95, Math.max(0.85, scrollY / 120 + 0.85))})`,
            backdropFilter: `blur(${Math.max(18, Math.min(24, scrollY / 8 + 18))}px) saturate(1.8)`,
            WebkitBackdropFilter: `blur(${Math.max(18, Math.min(24, scrollY / 8 + 18))}px) saturate(1.8)`,
            borderTop: `1px solid rgba(255,255,255,${Math.min(0.35, Math.max(0.15, scrollY / 400))})`,
          }}
        >
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-base font-medium text-ink hover:bg-primary/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="ghost"
                className="btn-ghost w-full justify-center"
              >
                Log in
              </Button>
              <Button className="btn-primary w-full justify-center">
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
