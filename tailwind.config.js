/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      animation: {
        pulseSlow: "pulseSlow 3s ease-in-out infinite",
        orbit: "orbit 16s linear infinite",
        scan: "scan 4s linear infinite",
        drift: "drift 7s ease-in-out infinite"
      },
      keyframes: {
        pulseSlow: {
          "0%, 100%": { opacity: "0.62", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" }
        },
        orbit: {
          to: { transform: "rotate(360deg)" }
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" }
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -10px, 0)" }
        }
      }
    }
  },
  plugins: []
};
