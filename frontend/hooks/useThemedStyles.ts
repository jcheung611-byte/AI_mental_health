/**
 * useThemedStyles Hook
 *
 * Provides dynamic inline styles based on current theme
 * Returns style objects that use CSS custom properties set by ThemeContext
 */

import { useTheme } from '@/contexts/ThemeContext'
import { CSSProperties } from 'react'

export function useThemedStyles() {
  const { theme } = useTheme()

  const styles = {
    // Primary button style
    primaryButton: {
      backgroundColor: theme.colors.primary,
      color: 'white',
      borderRadius: theme.borderRadius.lg,
      transition: `all ${theme.animations.duration} ${theme.animations.easing}`,
      boxShadow: theme.shadows.sm,
    } as CSSProperties,

    // Secondary button style
    secondaryButton: {
      backgroundColor: theme.colors.secondary,
      color: 'white',
      borderRadius: theme.borderRadius.lg,
      transition: `all ${theme.animations.duration} ${theme.animations.easing}`,
      boxShadow: theme.shadows.sm,
    } as CSSProperties,

    // User message bubble (mobile)
    userBubble: {
      backgroundColor: theme.colors.primary,
      color: 'white',
      borderRadius: theme.borderRadius.xl,
      boxShadow: theme.shadows.md,
    } as CSSProperties,

    // User message card (desktop)
    userCard: {
      backgroundColor: `${theme.colors.primary}15`, // 15% opacity
      borderColor: `${theme.colors.primary}40`,
      borderRadius: theme.borderRadius.lg,
      borderWidth: '1px',
      borderStyle: 'solid',
    } as CSSProperties,

    // Assistant message bubble
    assistantBubble: {
      backgroundColor: `${theme.colors.secondary}15`,
      borderColor: `${theme.colors.secondary}40`,
      borderRadius: theme.borderRadius.xl,
      borderWidth: '1px',
      borderStyle: 'solid',
      boxShadow: theme.shadows.sm,
    } as CSSProperties,

    // Background
    background: {
      backgroundColor: theme.colors.background,
    } as CSSProperties,

    // Surface (cards, modals)
    surface: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.shadows.md,
    } as CSSProperties,

    // Border
    border: {
      borderColor: theme.colors.border,
    } as CSSProperties,

    // Text colors
    textPrimary: {
      color: theme.colors.text,
    } as CSSProperties,

    textSecondary: {
      color: theme.colors.textLight,
    } as CSSProperties,
  }

  return { styles, theme }
}
