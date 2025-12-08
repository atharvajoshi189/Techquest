import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: '#740001',
        gold: '#D4AF37',
        parchment: '#F5E6C8',
        'ink-black': '#1A1A1A',
        'hogwarts-gold': '#D4AF37',
        'gryffindor-red': '#740001',
      },
      fontFamily: {
        cinzel: ['var(--font-cinzel)'],
        hand: ['var(--font-dancing)'],
      },
      backgroundImage: {
        'parchment-texture': "url('https://www.transparenttextures.com/patterns/aged-paper.png')",
      },
    },
  },
  plugins: [],
};
export default config;
