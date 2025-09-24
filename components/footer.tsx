import Link from "next/link";
import { Globe, Instagram, Facebook } from "lucide-react";

const footerColumns = [
  {
    title: "Resources",
    links: [
      "Contact Us",
      "Affiliates",
      "Feature Request",
      "Blog",
      "FAQs",
      "About",
    ],
  },
  {
    title: "How To",
    links: [
      "Humanize AI Text",
      "Word Counter",
      "0% AI Score",
      "Mastering ZeroGPT",
      "AI Detection for SEO",
    ],
  },
  {
    title: "Compare",
    links: [
      "AI Detector Alternative",
      "StealthGPT Alternative",
      "Stealth Writer Alternative",
      "Phrasly AI Alternative",
    ],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms", "Do Not Sell My Info"],
  },
];

const socialLinks = [
  { id: "instagram", href: "/instagram", label: "Instagram" },
  { id: "x", href: "/x", label: "X" },
  { id: "facebook", href: "/facebook", label: "Facebook" },
  { id: "tiktok", href: "/tiktok", label: "TikTok" },
];

export function Footer() {
  return (
    <footer className="bg-ink text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container py-20 relative z-10">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {footerColumns.map((column, index) => (
            <div key={column.title} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <h3 className="font-bold mb-6 text-white text-lg">{column.title}</h3>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer bottom */}
        <div className="border-t border-gray-600/30 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo and tagline */}
            <div className="text-center md:text-left animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <div className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                WriteHuman
              </div>
              <div className="text-lg text-gray-300 font-medium">Writing, Perfected.</div>
            </div>

            {/* Social links */}
            <div className="flex gap-4 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
              {socialLinks.map((social) => (
                <Link
                  key={social.id}
                  href={social.href}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-primary hover:scale-110 transition-all duration-200 flex items-center justify-center text-gray-300 hover:text-white"
                  aria-label={social.label}
                >
                  <Globe className="h-6 w-6" />
                </Link>
              ))}
            </div>

            {/* Copyright */}
            <div className="text-base text-gray-300 text-center md:text-right font-medium animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
              © 2025 WriteHuman, LLC.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
