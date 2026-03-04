/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Core palette from Rapid Capsule Design System
        background: 'hsl(222, 47%, 11%)',
        foreground: 'hsl(210, 40%, 98%)',
        card: 'hsl(222, 47%, 13%)',
        'card-foreground': 'hsl(210, 40%, 98%)',
        primary: {
          DEFAULT: 'hsl(199, 89%, 48%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        secondary: {
          DEFAULT: 'hsl(25, 95%, 53%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        muted: {
          DEFAULT: 'hsl(222, 47%, 16%)',
          foreground: 'hsl(215, 20%, 55%)',
        },
        accent: {
          DEFAULT: 'hsl(239, 84%, 67%)', // indigo-500
          foreground: 'hsl(0, 0%, 100%)',
        },
        destructive: {
          DEFAULT: 'hsl(355, 90%, 60%)', // rose-500
          foreground: 'hsl(0, 0%, 100%)',
        },
        success: {
          DEFAULT: 'hsl(160, 84%, 39%)', // emerald-500
          foreground: 'hsl(0, 0%, 100%)',
        },
        border: 'hsl(222, 30%, 20%)',
        input: 'hsl(222, 30%, 20%)',
        ring: 'hsl(199, 89%, 48%)',
      },
      fontFamily: {
        display: ['Inter-Bold'],
        sans: ['Inter-Regular'],
        'sans-medium': ['Inter-Medium'],
        'sans-semibold': ['Inter-SemiBold'],
        'sans-bold': ['Inter-Bold'],
      },
      borderRadius: {
        '2xl': 16,
        '3xl': 24,
        '4xl': 32,
      },
    },
  },
  plugins: [],
};
