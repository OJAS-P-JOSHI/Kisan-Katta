export const palette = {
  forest: {
    50: '#EDF4E8',
    100: '#C5DBB8',
    500: '#4F772D',
    700: '#2D5A27',
    900: '#1A4D2E',
  },
  leaf: {
    400: '#6B9B3A',
    500: '#4F772D',
  },
  gold: {
    100: '#FEF3D0',
    400: '#E8A317',
    500: '#D4920A',
    600: '#B87A08',
  },
  cream: '#F5F0E6',
  creamDark: '#EBE4D6',
  mist: '#E0DBD0',
  ink: '#1A1C19',
  slate: '#3F463C',
  steel: '#6E7669',
  white: '#FFFFFF',
} as const

export const theme = {
  colors: palette,
  fonts: {
    english: '"Poppins", system-ui, sans-serif',
    marathi: '"Noto Sans Devanagari", "Poppins", system-ui, sans-serif',
  },
  shadows: {
    soft: '0 2px 16px -2px rgb(26 77 46 / 0.08)',
    card: '0 8px 32px -8px rgb(26 77 46 / 0.12)',
    lift: '0 16px 48px -12px rgb(26 77 46 / 0.16)',
  },
} as const
