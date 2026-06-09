import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec1ff',
          400: '#599eff',
          500: '#3479fb',
          600: '#1f5af0',
          700: '#1846dd',
          800: '#1a3ab3',
          900: '#1b358d',
        },
      },
    },
  },
  plugins: [],
};

export default config;
