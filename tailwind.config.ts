import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      mono: [
        "Roboto Mono",
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        "Liberation Mono",
        "Courier New",
        "monospace",
      ],
    },
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        customDark: {
          // 'text': 'hsl(0, 0%, 94%)',
          "base-100": "#0b1109",
          primary: "hsl(356, 100%, 22%)",
          secondary: "hsl(29, 91%, 30%)",
          accent: "hsl(146, 58%, 17%)",
          // primary: "#8D99AE",
          // secondary: "#121212",
          // accent: "#fd798f",
          // neutral: "#2a323c",
          // "base-100": "#2B2D42",
          // info: "#3abff8",
          // success: "#36d399",
          // warning: "#fbbd23",
          // error: "#f87272",

          // primary: "#55B47E",
          // secondary: "#C8355C",
          // accent: "#1576BA",
          neutral: "#0a121c",
          // "base-100": "#F9F7F7",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
        customLight: {
          primary: "#55B47E",
          secondary: "#C8355C",
          accent: "#1576BA",
          neutral: "#C9C7C7",
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
