import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FFFFFF',
        secondary: '#7C4A2D',
        accent: '#A0522D',
        muted: '#F5F0EB',
        dark: '#1A0A00',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 30px -16px rgb(26 10 0 / 0.35)',
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 25% 25%, rgba(160, 82, 45, 0.08), transparent 40%), radial-gradient(circle at 80% 0%, rgba(124, 74, 45, 0.1), transparent 30%)",
      },
    },
  },
  plugins: [],
};

export default config;
