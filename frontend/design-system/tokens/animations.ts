/**
 * Animation Design Tokens
 *
 * Defines motion, timing, and easing for all themes
 */

import { ThemeId } from './colors'

export interface AnimationTokens {
  duration: {
    instant?: string
    fast: string
    normal: string
    slow: string
  }
  easing: {
    standard: string
    emphasized?: string
    decelerate?: string
    accelerate?: string
    smooth?: string
    bounce?: string
    spring?: string
    elastic?: string
  }
  // Keyframe animations (theme-specific)
  keyframes?: Record<string, string>
}

export const themeAnimations: Record<ThemeId, AnimationTokens> = {
  'theme-a-warm': {
    // Theme A: Warm & Calming
    // Organic, breathing motion
    duration: {
      fast: '200ms',
      normal: '350ms',
      slow: '500ms',
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)', // Standard ease-in-out
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Gentle bounce
      elastic: 'cubic-bezier(0.68, -0.25, 0.265, 1.25)', // Subtle elastic
    },
    keyframes: {
      'pulse-slow': `
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `,
      breathe: `
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `,
      'wave-gentle': `
        @keyframes wave-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `,
    },
  },

  'theme-b-modern': {
    // Theme B: Modern & Alive
    // Snappy, energetic motion
    duration: {
      instant: '100ms',
      fast: '200ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.6, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)', // Sharp, decisive
      emphasized: 'cubic-bezier(0.2, 0, 0, 1)', // Emphasized deceleration
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    keyframes: {
      'gradient-shift': `
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `,
      shimmer: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `,
      'pulse-glow': `
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(14, 165, 233, 0.4); }
          50% { box-shadow: 0 0 40px rgba(14, 165, 233, 0.6); }
        }
      `,
    },
  },

  'theme-c-minimal': {
    // Theme C: Minimalist & Focused
    // Intentional, purposeful motion
    duration: {
      instant: '0ms', // Often no animation
      fast: '150ms',
      normal: '250ms',
      slow: '400ms',
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      decelerate: 'cubic-bezier(0, 0, 0.2, 1)', // Deceleration curve
      accelerate: 'cubic-bezier(0.4, 0, 1, 1)', // Acceleration curve
    },
    keyframes: {
      'fade-in': `
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,
      'fade-out': `
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `,
    },
  },

  'theme-d-playful': {
    // Theme D: Playful & Human
    // Bouncy, delightful motion
    duration: {
      fast: '250ms',
      normal: '400ms',
      slow: '600ms',
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.25, 0.265, 1.25)', // Playful bounce
      spring: 'cubic-bezier(0.5, 1.75, 0.75, 1.25)', // Spring effect
    },
    keyframes: {
      wiggle: `
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
      `,
      bounce: `
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `,
      'shake-gentle': `
        @keyframes shake-gentle {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `,
    },
  },
}

/**
 * Get animation tokens for a specific theme
 */
export function getThemeAnimations(themeId: ThemeId): AnimationTokens {
  return themeAnimations[themeId]
}
