/**
 * Spacing Design Tokens
 *
 * Defines consistent spacing scales for all themes
 */

import { ThemeId } from './colors'

export interface SpacingTokens {
  space: {
    px: string
    0: string
    0.5: string
    1: string
    2: string
    3: string
    4: string
    5: string
    6: string
    8: string
    10: string
    12: string
    16: string
    20: string
    24: string
  }
  radius: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    full: string
  }
}

export const themeSpacing: Record<ThemeId, SpacingTokens> = {
  'theme-a-warm': {
    // Theme A: Warm & Calming
    // 4px base unit, 1.5 ratio for comfortable spacing
    space: {
      px: '1px',
      0: '0',
      0.5: '0.125rem', // 2px
      1: '0.25rem', // 4px
      2: '0.5rem', // 8px
      3: '0.75rem', // 12px
      4: '1rem', // 16px
      5: '1.5rem', // 24px
      6: '2rem', // 32px
      8: '3rem', // 48px
      10: '4rem', // 64px
      12: '6rem', // 96px
      16: '8rem', // 128px
      20: '10rem', // 160px
      24: '12rem', // 192px
    },
    radius: {
      xs: '4px',
      sm: '8px', // Buttons, small cards
      md: '16px', // Cards, inputs
      lg: '24px', // Large containers
      xl: '32px', // Hero sections
      '2xl': '40px',
      '3xl': '48px',
      full: '9999px', // Pills, circular buttons
    },
  },

  'theme-b-modern': {
    // Theme B: Modern & Alive
    // 4px base, slightly aggressive scale
    space: {
      px: '1px',
      0: '0',
      0.5: '0.125rem', // 2px
      1: '0.25rem', // 4px
      2: '0.5rem', // 8px
      3: '0.75rem', // 12px
      4: '1rem', // 16px
      5: '1.25rem', // 20px
      6: '1.5rem', // 24px
      8: '2rem', // 32px
      10: '2.5rem', // 40px
      12: '3rem', // 48px
      16: '4rem', // 64px
      20: '5rem', // 80px
      24: '6rem', // 96px
    },
    radius: {
      xs: '6px',
      sm: '10px', // Sharp but friendly
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px',
      full: '9999px',
    },
  },

  'theme-c-minimal': {
    // Theme C: Minimalist & Focused
    // 8px base unit, generous whitespace
    space: {
      px: '1px',
      0: '0',
      0.5: '0.125rem', // 2px
      1: '0.25rem', // 4px
      2: '0.5rem', // 8px
      3: '0.75rem', // 12px
      4: '1rem', // 16px
      5: '1.25rem', // 20px
      6: '1.5rem', // 24px
      8: '2rem', // 32px
      10: '2.5rem', // 40px
      12: '3rem', // 48px
      16: '4rem', // 64px
      20: '5rem', // 80px
      24: '6rem', // 96px
    },
    radius: {
      xs: '2px',
      sm: '4px',
      md: '6px', // Most common
      lg: '8px',
      xl: '12px',
      '2xl': '16px',
      '3xl': '20px',
      full: '9999px',
    },
  },

  'theme-d-playful': {
    // Theme D: Playful & Human
    // 4px base, balanced scale
    space: {
      px: '1px',
      0: '0',
      0.5: '0.125rem', // 2px
      1: '0.25rem', // 4px
      2: '0.5rem', // 8px
      3: '0.75rem', // 12px
      4: '1rem', // 16px
      5: '1.25rem', // 20px
      6: '1.5rem', // 24px
      8: '2rem', // 32px
      10: '2.5rem', // 40px
      12: '3rem', // 48px
      16: '4rem', // 64px
      20: '5rem', // 80px
      24: '6rem', // 96px
    },
    radius: {
      xs: '8px',
      sm: '12px', // More rounded than typical
      md: '20px',
      lg: '28px',
      xl: '40px',
      '2xl': '56px',
      '3xl': '72px',
      full: '9999px',
    },
  },
}

/**
 * Get spacing tokens for a specific theme
 */
export function getThemeSpacing(themeId: ThemeId): SpacingTokens {
  return themeSpacing[themeId]
}
