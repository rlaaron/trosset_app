import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B4513',
          light: '#A0522D',
          dark: '#5D2E0C',
        },
        accent: {
          DEFAULT: '#D2691E',
          light: '#F4A460',
        },
        background: '#FFF8F0',
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#FFFAF5',
        },
        text: {
          primary: '#3D2914',
          secondary: '#8B7355',
          muted: '#A89880',
        },
        border: {
          DEFAULT: '#E8DDD0',
          light: '#F0E8DC',
        },
      },
    },
  },
  plugins: [],
};
export default config;
