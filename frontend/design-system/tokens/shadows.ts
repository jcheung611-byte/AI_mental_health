/**
 * Shadow Design Tokens
 *
 * Defines elevation and shadow systems for all themes
 */

import { ThemeId } from './colors'

export interface ShadowTokens {
  shadow: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
    inner: string
    glow?: string
    'glow-primary'?: string
    'glow-accent'?: string
  }
  // Glassmorphism (Theme B specific, but defined for all)
  glass?: {
    background: string
    border: string
    shadow: string
  }
}

export const themeShadows: Record<ThemeId, ShadowTokens> = {
  'theme-a-warm': {
    // Theme A: Warm & Calming
    // Soft, warm shadows with orange/peachy tints
    shadow: {
      xs: '0 1px 2px 0 rgba(255, 143, 92, 0.05)',
      sm: '0 2px 8px 0 rgba(255, 143, 92, 0.08)',
      md: '0 4px 16px 0 rgba(255, 143, 92, 0.12)',
      lg: '0 8px 32px 0 rgba(255, 143, 92, 0.16)',
      xl: '0 16px 48px 0 rgba(255, 143, 92, 0.2)',
      '2xl': '0 24px 64px 0 rgba(255, 143, 92, 0.24)',
      inner: 'inset 0 2px 4px 0 rgba(255, 143, 92, 0.06)',
      glow: '0 0 24px 0 rgba(255, 143, 92, 0.4)',
      'glow-primary': '0 0 32px 0 rgba(255, 143, 92, 0.5)',
      'glow-accent': '0 0 32px 0 rgba(255, 209, 102, 0.5)',
    },
  },

  'theme-b-modern': {
    // Theme B: Modern & Alive
    // Bold, colorful shadows with glassmorphism
    shadow: {
      xs: '0 1px 2px 0 rgba(14, 165, 233, 0.06), 0 0px 1px 0 rgba(139, 92, 246, 0.03)',
      sm: '0 2px 4px 0 rgba(14, 165, 233, 0.08), 0 1px 2px 0 rgba(139, 92, 246, 0.04)',
      md: '0 4px 12px 0 rgba(14, 165, 233, 0.12), 0 2px 4px 0 rgba(139, 92, 246, 0.06)',
      lg: '0 8px 24px 0 rgba(14, 165, 233, 0.16), 0 4px 8px 0 rgba(139, 92, 246, 0.08)',
      xl: '0 16px 48px 0 rgba(14, 165, 233, 0.2), 0 8px 16px 0 rgba(139, 92, 246, 0.1)',
      '2xl': '0 24px 64px 0 rgba(14, 165, 233, 0.24), 0 12px 24px 0 rgba(139, 92, 246, 0.12)',
      inner: 'inset 0 2px 4px 0 rgba(14, 165, 233, 0.08)',
      'glow-primary': '0 0 32px 0 rgba(14, 165, 233, 0.5)',
      'glow-accent': '0 0 32px 0 rgba(236, 72, 153, 0.5)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(255, 255, 255, 0.2)',
      shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    },
  },

  'theme-c-minimal': {
    // Theme C: Minimalist & Focused
    // Subtle, realistic shadows (no glows)
    shadow: {
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    },
  },

  'theme-d-playful': {
    // Theme D: Playful & Human
    // Soft, friendly shadows with character
    shadow: {
      xs: '0 2px 4px 0 rgba(74, 159, 245, 0.08)',
      sm: '0 4px 8px 0 rgba(74, 159, 245, 0.12)',
      md: '0 8px 16px 0 rgba(74, 159, 245, 0.14)',
      lg: '0 12px 24px 0 rgba(74, 159, 245, 0.18)',
      xl: '0 20px 40px 0 rgba(74, 159, 245, 0.2)',
      '2xl': '0 28px 56px 0 rgba(74, 159, 245, 0.24)',
      inner: 'inset 0 2px 4px 0 rgba(74, 159, 245, 0.1)',
      glow: '0 6px 12px 0 rgba(255, 148, 114, 0.25)', // For illustrations
      'glow-primary': '0 8px 16px 0 rgba(74, 159, 245, 0.3)',
      'glow-accent': '0 8px 16px 0 rgba(255, 200, 73, 0.3)',
    },
  },
}

/**
 * Get shadow tokens for a specific theme
 */
export function getThemeShadows(themeId: ThemeId): ShadowTokens {
  return themeShadows[themeId]
}
