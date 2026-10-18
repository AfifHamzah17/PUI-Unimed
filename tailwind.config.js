/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: token('paper'),
        surface: token('surface'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        brand: token('brand'),
        'brand-soft': token('brand-soft'),
        'on-brand': token('on-brand'),
        accent: token('accent'),
        deep: token('deep'),
        'deep-2': token('deep-2'),
        mist: token('mist'),
        danger: token('danger'),
      },
      fontFamily: {
        display: ['Newsreader', 'Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: { shell: '1280px', prose: '65ch' },
      boxShadow: {
        // Bayangan diwarnai hijau tua agar menyatu dengan latar, bukan abu-abu netral.
        lift: '0 24px 48px -24px rgb(10 32 24 / 0.28)',
        soft: '0 12px 32px -18px rgb(10 32 24 / 0.22)',
        inset: 'inset 0 1px 0 rgb(255 255 255 / 0.10)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      keyframes: {
        marquee: { from: { transform: 'translate3d(0,0,0)' }, to: { transform: 'translate3d(-50%,0,0)' } },
        floaty: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-10px,0)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translate3d(0,14px,0)' },
          to: { opacity: '1', transform: 'translate3d(0,0,0)' },
        },
        pulseDot: {
          '0%,100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.9)', opacity: '0' },
        },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        floaty: 'floaty 7s ease-in-out infinite',
        rise: 'rise 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-dot': 'pulseDot 2.4s ease-out infinite',
      },
    },
  },
  plugins: [],
};
