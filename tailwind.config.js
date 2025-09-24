/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2B3A67",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#A855F7",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#A855F7",
          foreground: "#FFFFFF",
        },
        background: "#F8F6F3",
        foreground: "#2B3A67",
        muted: {
          DEFAULT: "#6B7280",
          foreground: "#6B7280",
        },
        border: "#E5E7EB",
        input: "#FFFFFF",
        ring: "#A855F7",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#2B3A67",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0, 0, 0, 0.1)",
        card: "0 2px 12px rgba(0, 0, 0, 0.08)",
      },
    },
  },
};
