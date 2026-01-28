/**
 * Theme System - Full Theme Definitions
 *
 * Each theme includes:
 * - Colors (primary, secondary, accent, backgrounds)
 * - Border radius values
 * - Shadow styles
 * - Animation configurations
 * - Typography settings
 */

export type ThemeId = 'minimalist' | 'warm' | 'modern' | 'playful'

export interface Theme {
  id: ThemeId
  name: string
  description: string
  colors: {
    primary: string
    primaryLight: string
    primaryDark: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textLight: string
    border: string
    success: string
    warning: string
    error: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    xl: string
    full: string
  }
  shadows: {
    sm: string
    md: string
    lg: string
    glow: string
  }
  animations: {
    duration: string
    easing: string
    hoverScale: number
    tapScale: number
  }
}

export const themes: Record<ThemeId, Theme> = {
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist & Focused',
    description: 'Clean, professional, intentional',
    colors: {
      primary: '#3B82F6',
      primaryLight: '#60A5FA',
      primaryDark: '#2563EB',
      secondary: '#8B5CF6',
      accent: '#EC4899',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#111827',
      textLight: '#6B7280',
      border: '#E5E7EB',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    borderRadius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      glow: 'none',
    },
    animations: {
      duration: '200ms',
      easing: 'ease-in-out',
      hoverScale: 1.02,
      tapScale: 0.98,
    },
  },

  warm: {
    id: 'warm',
    name: 'Warm & Calming',
    description: 'Sunset gradients, organic, soothing',
    colors: {
      primary: '#FF8F5C',
      primaryLight: '#FFB088',
      primaryDark: '#FF6B30',
      secondary: '#B78BF0',
      accent: '#FFD166',
      background: '#FFF8F0',
      surface: '#FFFFFF',
      text: '#4A3B2F',
      textLight: '#8B7766',
      border: '#FFE4CC',
      success: '#7BC96F',
      warning: '#FFB84D',
      error: '#FF6B6B',
    },
    borderRadius: {
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      full: '9999px',
    },
    shadows: {
      sm: '0 2px 4px 0 rgba(255, 143, 92, 0.1)',
      md: '0 4px 12px 0 rgba(255, 143, 92, 0.15)',
      lg: '0 8px 24px 0 rgba(255, 143, 92, 0.2)',
      glow: '0 0 20px rgba(255, 143, 92, 0.3)',
    },
    animations: {
      duration: '400ms',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      hoverScale: 1.05,
      tapScale: 0.95,
    },
  },

  modern: {
    id: 'modern',
    name: 'Modern & Alive',
    description: 'Bold colors, glassmorphism, energetic',
    colors: {
      primary: '#0EA5E9',
      primaryLight: '#38BDF8',
      primaryDark: '#0284C7',
      secondary: '#8B5CF6',
      accent: '#EC4899',
      background: '#F0F9FF',
      surface: 'rgba(255, 255, 255, 0.9)',
      text: '#0F172A',
      textLight: '#64748B',
      border: '#CBD5E1',
      success: '#22C55E',
      warning: '#F97316',
      error: '#F43F5E',
    },
    borderRadius: {
      sm: '10px',
      md: '18px',
      lg: '28px',
      xl: '48px',
      full: '9999px',
    },
    shadows: {
      sm: '0 2px 8px 0 rgba(14, 165, 233, 0.1)',
      md: '0 8px 16px 0 rgba(139, 92, 246, 0.15)',
      lg: '0 16px 32px 0 rgba(236, 72, 153, 0.2)',
      glow: '0 0 30px rgba(139, 92, 246, 0.4)',
    },
    animations: {
      duration: '250ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      hoverScale: 1.03,
      tapScale: 0.97,
    },
  },

  playful: {
    id: 'playful',
    name: 'Playful & Human',
    description: 'Friendly, rounded, warm and approachable',
    colors: {
      primary: '#4A9FF5',
      primaryLight: '#7BB8F7',
      primaryDark: '#2B7FD9',
      secondary: '#FF9472',
      accent: '#FFC849',
      background: '#FFF9F0',
      surface: '#FFFFFF',
      text: '#2D3748',
      textLight: '#718096',
      border: '#FFE9D6',
      success: '#68D391',
      warning: '#F6AD55',
      error: '#FC8181',
    },
    borderRadius: {
      sm: '12px',
      md: '20px',
      lg: '32px',
      xl: '56px',
      full: '9999px',
    },
    shadows: {
      sm: '0 2px 6px 0 rgba(74, 159, 245, 0.12)',
      md: '0 6px 16px 0 rgba(255, 148, 114, 0.18)',
      lg: '0 12px 28px 0 rgba(255, 200, 73, 0.24)',
      glow: '0 0 25px rgba(255, 148, 114, 0.35)',
    },
    animations: {
      duration: '350ms',
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      hoverScale: 1.08,
      tapScale: 0.92,
    },
  },
}

export const defaultTheme: ThemeId = 'minimalist'
