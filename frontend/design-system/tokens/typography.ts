/**
 * Typography Design Tokens
 *
 * Defines font families, sizes, weights, and line heights for all themes
 */

import { ThemeId } from './colors'

export interface TypographyTokens {
  fontFamily: {
    sans: string
    display: string
    mono: string
  }
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
    '5xl': string
  }
  fontWeight: {
    normal: number
    medium: number
    semibold: number
    bold: number
    extrabold?: number
  }
  lineHeight: {
    tight: number
    snug: number
    normal: number
    relaxed: number
  }
  letterSpacing: {
    tighter: string
    tight: string
    normal: string
    wide: string
  }
}

export const themeTypography: Record<ThemeId, TypographyTokens> = {
  'theme-a-warm': {
    // Theme A: Warm & Calming
    // Friendly, readable fonts with gentle curves
    fontFamily: {
      sans: "'Inter Variable', 'SF Pro Display', system-ui, -apple-system, sans-serif",
      display: "'Cabinet Grotesk Variable', 'Inter Variable', sans-serif",
      mono: "'JetBrains Mono', 'SF Mono', 'Menlo', monospace",
    },
    fontSize: {
      // Fluid typography using clamp()
      xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', // 12-14px
      sm: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', // 14-16px
      base: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', // 16-18px
      lg: 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)', // 18-20px
      xl: 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)', // 20-24px
      '2xl': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)', // 24-32px
      '3xl': 'clamp(2rem, 1.7rem + 1.5vw, 3rem)', // 32-48px
      '4xl': 'clamp(2.5rem, 2rem + 2vw, 4rem)', // 40-64px
      '5xl': 'clamp(3rem, 2.5rem + 2.5vw, 5rem)', // 48-80px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
    },
    letterSpacing: {
      tighter: '-0.02em',
      tight: '-0.01em',
      normal: '0',
      wide: '0.01em',
    },
  },

  'theme-b-modern': {
    // Theme B: Modern & Alive
    // Bold, contemporary typography
    fontFamily: {
      sans: "'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "'Clash Display Variable', 'Inter Variable', sans-serif",
      mono: "'JetBrains Mono Variable', 'Fira Code', monospace",
    },
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '2rem', // 32px
      '4xl': '2.5rem', // 40px
      '5xl': '3rem', // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.15,
      snug: 1.3,
      normal: 1.5,
      relaxed: 1.7,
    },
    letterSpacing: {
      tighter: '-0.03em',
      tight: '-0.015em',
      normal: '0',
      wide: '0.02em',
    },
  },

  'theme-c-minimal': {
    // Theme C: Minimalist & Focused
    // System fonts for ultimate clarity
    fontFamily: {
      sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
      display: "'SF Pro Display', 'Inter Variable', -apple-system, sans-serif",
      mono: "'SF Mono', 'Menlo', 'Consolas', monospace",
    },
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1.0625rem', // 17px - iOS native text size
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '2rem', // 32px
      '4xl': '2.5rem', // 40px
      '5xl': '3rem', // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.45,
      normal: 1.6,
      relaxed: 1.75,
    },
    letterSpacing: {
      tighter: '-0.01em',
      tight: '-0.005em',
      normal: '0',
      wide: '0.01em',
    },
  },

  'theme-d-playful': {
    // Theme D: Playful & Human
    // Rounded, friendly fonts
    fontFamily: {
      sans: "'DM Sans Variable', 'Nunito', 'Poppins', 'Inter', sans-serif",
      display: "'Fredoka Variable', 'DM Sans Variable', sans-serif",
      mono: "'JetBrains Mono', 'SF Mono', monospace",
    },
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '2rem', // 32px
      '4xl': '2.5rem', // 40px
      '5xl': '3rem', // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.3,
      snug: 1.45,
      normal: 1.6,
      relaxed: 1.75,
    },
    letterSpacing: {
      tighter: '-0.01em',
      tight: '0',
      normal: '0.005em',
      wide: '0.015em',
    },
  },
}

/**
 * Get typography tokens for a specific theme
 */
export function getThemeTypography(themeId: ThemeId): TypographyTokens {
  return themeTypography[themeId]
}
