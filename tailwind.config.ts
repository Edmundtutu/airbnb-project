import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Nunito Sans", "system-ui", "sans-serif"], // Changed to Nunito Sans
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          50: '357 85% 97%',
          100: '357 85% 92%',
          200: '357 85% 80%',
          300: '357 85% 70%',
          400: '357 85% 60%',
          500: '357 85% 56%', // Imperial red
          600: '8 88% 56%', // Cinnabar
          700: '17 93% 55%', // Giants orange
          800: '26 97% 54%', // Safety orange
          900: '33 100% 52%', // Princeton orange
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          50: '8 88% 97%',
          100: '8 88% 92%',
          200: '8 88% 80%',
          300: '8 88% 70%',
          400: '8 88% 60%',
          500: '8 88% 56%', // Cinnabar
          600: '357 85% 56%', // Imperial red
          700: '347 83% 50%', // Red crayola
          800: '17 93% 55%', // Giants orange
          900: '26 97% 54%', // Safety orange
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // Text colors optimized for Nunito Sans
        text: {
          primary: '222 84% 15%',    // Dark gray for main text
          secondary: '222 84% 35%',   // Medium gray for secondary
          tertiary: '222 84% 55%',    // Lighter gray for tertiary
          muted: '222 84% 65%',       // Muted text
          inverse: '0 0% 100%',       // White text on colored backgrounds
        },
        // ... rest of your colors remain the same
        success: {
          50: '158 64% 97%',
          500: '158 64% 52%',
        },
        warning: {
          50: '38 92% 97%',
          500: '38 92% 50%',
        },
        error: {
          50: '0 84% 97%',
          500: '0 84% 60%',
        },
        info: {
          50: '189 94% 97%',
          500: '189 94% 43%',
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        red: {
          imperial: '357 85% 56%',
          crayola: '347 83% 50%',
          cinnabar: '8 88% 56%',
        },
        orange: {
          giants: '17 93% 55%',
          safety: '26 97% 54%',
          princeton: '33 100% 52%',
        },
      },
      // ... rest of your config
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;