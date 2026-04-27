/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Firecrawl monochrome system (dark mode)
        border: "hsl(var(--border))",
        "border-hover": "hsl(var(--border-hover))",
        explicit: "hsl(var(--explicit))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
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
        // Firecrawl surface hierarchy — pure black to near-black
        surface: {
          DEFAULT: "#000000",
          elevated: "#0d0d0d",
          highlight: "#1a1a1a",
        },
        // Retained for any legacy usage — will be treated as white
        velocity: {
          indigo: "#f5f5f5",
          violet: "#c2c2c2",
          cyan: "#f5f5f5",
        }
      },

      fontFamily: {
        // Firecrawl: serif for editorial headings, sans for body, mono for code
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        serif: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
      },

      fontSize: {
        'display': ['52px', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'h1': ['40px', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'h2': ['28px', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        'h3': ['24px', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        'body': ['16px', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'label': ['13px', { lineHeight: '1.6', letterSpacing: '0em' }],
        'caption': ['10px', { lineHeight: '1.6', letterSpacing: '0em' }],
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
        'scale-in': 'scaleIn 0.15s ease-in-out',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        // Firecrawl: no glow, subtle material depth
        'glow-primary': 'none',
        'glow-accent': 'none',
        'inner-glow': 'none',
        'editorial': '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.8)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Firecrawl: perfect pill shapes
        pill: "999px",
        // Editorial rounded corners for cards
        editorial: "2rem",
      },
    },
  },
  plugins: [],
}
