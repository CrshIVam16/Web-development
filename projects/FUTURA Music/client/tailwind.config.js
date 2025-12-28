/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(1000px 600px at 10% -10%, rgba(56,189,248,0.15), transparent), radial-gradient(800px 500px at 90% 10%, rgba(168,85,247,0.12), transparent), radial-gradient(600px 300px at 50% 100%, rgba(59,130,246,0.12), transparent)",
      },
      keyframes: {
        glow: {
          "0%, 100%": { boxShadow: "0 0 25px rgba(168,85,247,0.35)" },
          "50%": { boxShadow: "0 0 45px rgba(56,189,248,0.45)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleIn: { from: { opacity: 0, transform: "scale(0.98)" }, to: { opacity: 1, transform: "scale(1)" } },
      },
      animation: {
        glow: "glow 2.8s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "fade-in": "fadeIn .5s ease-out both",
        "scale-in": "scaleIn .35s ease-out both",
      },
      boxShadow: {
        "neon-pink": "0 0 25px rgba(244,114,182,0.45)",
        "neon-cyan": "0 0 25px rgba(34,211,238,0.45)",
      },
    },
  },
  plugins: [],
};