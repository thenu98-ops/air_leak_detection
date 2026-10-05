export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        canvas: '#F1F4F0',
        surface: '#FFFFFF',
        ink: '#0D1B14',
        muted: '#5B6B62',
        line: '#E1E7E2',
        brand: { DEFAULT: '#046C3A', soft: '#E3F1E8', deep: '#0A2518' },
        signal: '#C4F25E',
        warn: { DEFAULT: '#A85A06', soft: '#FDF1D8' },
        danger: { DEFAULT: '#B9232B', soft: '#FCE7E7' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { '4xl': '1.75rem' },
    },
  },
}
