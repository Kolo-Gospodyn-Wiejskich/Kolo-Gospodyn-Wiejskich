import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        customDark: {
          primary: "#8D99AE",
          secondary: "#121212",
          accent: "#fd798f",
          neutral: "#2a323c",
          "base-100": "#2B2D42",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
        customLight: {
          primary: "#55B47E",
          secondary: "#C8355C",
          accent: "#1576BA",
          neutral: "#2a323c",
          "base-100": "#F9F7F7",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
      },
    ],
  },
} satisfies Config;
