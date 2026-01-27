/**
 * Design Tokens
 *
 * Central export for all design tokens
 */

export * from './colors'
export * from './typography'
export * from './spacing'
export * from './shadows'
export * from './animations'

import { ThemeId, getThemeColors, themeColors } from './colors'
import { getThemeTypography, themeTypography } from './typography'
import { getThemeSpacing, themeSpacing } from './spacing'
import { getThemeShadows, themeShadows } from './shadows'
import { getThemeAnimations, themeAnimations } from './animations'

/**
 * Get all tokens for a specific theme
 */
export function getAllTokens(themeId: ThemeId) {
  return {
    colors: getThemeColors(themeId),
    typography: getThemeTypography(themeId),
    spacing: getThemeSpacing(themeId),
    shadows: getThemeShadows(themeId),
    animations: getThemeAnimations(themeId),
  }
}

/**
 * Theme metadata
 */
export const themeMetadata: Record<ThemeId, { name: string; description: string }> = {
  'theme-a-warm': {
    name: 'Warm & Calming',
    description: 'Sunset gradients, organic shapes, breathing animations',
  },
  'theme-b-modern': {
    name: 'Modern & Alive',
    description: 'Bold colors, glassmorphism, fluid motion',
  },
  'theme-c-minimal': {
    name: 'Minimalist & Focused',
    description: 'Clean, zero-UI principles, sophisticated simplicity',
  },
  'theme-d-playful': {
    name: 'Playful & Human',
    description: 'Friendly, character-driven, warm interactions',
  },
}

export { themeColors, themeTypography, themeSpacing, themeShadows, themeAnimations }
