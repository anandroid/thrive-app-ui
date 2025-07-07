export const theme = {
  colors: {
    primary: {
      sage: '#87A878',
      earth: '#8B7355',
      sky: '#6B9BD1',
    },
    secondary: {
      lavender: '#B4A7D6',
      peach: '#FFE5D9',
      mint: '#E8F5E9',
    },
    neutral: {
      cream: '#FAF9F6',
      stone: '#F5F5F0',
      charcoal: '#2C3E50',
      warmGray: '#8E8E93',
    },
    accent: {
      coral: '#FF6B6B',
      gold: '#FFD700',
      deepPurple: '#7B68EE',
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
} as const;

export type Theme = typeof theme;