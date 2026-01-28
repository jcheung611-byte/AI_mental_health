/**
 * Theme Context - Updated for Week 9
 *
 * Provides theme switching functionality across the app
 * Supports 4 full themes with colors, animations, shadows, and border radius
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { themes, defaultTheme, ThemeId, Theme } from '@/design-system/themes'

interface ThemeContextValue {
  themeId: ThemeId
  theme: Theme
  setTheme: (theme: ThemeId) => void
  themes: typeof themes
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: ThemeId
}

export function ThemeProvider({ children, defaultTheme: initialTheme = defaultTheme }: ThemeProviderProps) {
  const [themeId, setThemeState] = useState<ThemeId>(initialTheme)

  // Load theme from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedTheme = localStorage.getItem('app-theme') as ThemeId
    if (savedTheme && themes[savedTheme]) {
      setThemeState(savedTheme)
    }
  }, [])

  // Apply theme to document and save to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    document.documentElement.setAttribute('data-theme', themeId)
    localStorage.setItem('app-theme', themeId)

    // Apply CSS custom properties for theme
    const currentTheme = themes[themeId]
    const root = document.documentElement.style

    // Colors
    root.setProperty('--color-primary', currentTheme.colors.primary)
    root.setProperty('--color-primary-light', currentTheme.colors.primaryLight)
    root.setProperty('--color-primary-dark', currentTheme.colors.primaryDark)
    root.setProperty('--color-secondary', currentTheme.colors.secondary)
    root.setProperty('--color-accent', currentTheme.colors.accent)
    root.setProperty('--color-background', currentTheme.colors.background)
    root.setProperty('--color-surface', currentTheme.colors.surface)
    root.setProperty('--color-text', currentTheme.colors.text)
    root.setProperty('--color-text-light', currentTheme.colors.textLight)
    root.setProperty('--color-border', currentTheme.colors.border)

    // Border Radius
    root.setProperty('--radius-sm', currentTheme.borderRadius.sm)
    root.setProperty('--radius-md', currentTheme.borderRadius.md)
    root.setProperty('--radius-lg', currentTheme.borderRadius.lg)
    root.setProperty('--radius-xl', currentTheme.borderRadius.xl)
    root.setProperty('--radius-full', currentTheme.borderRadius.full)

    // Shadows
    root.setProperty('--shadow-sm', currentTheme.shadows.sm)
    root.setProperty('--shadow-md', currentTheme.shadows.md)
    root.setProperty('--shadow-lg', currentTheme.shadows.lg)
    root.setProperty('--shadow-glow', currentTheme.shadows.glow)

    // Animations
    root.setProperty('--animation-duration', currentTheme.animations.duration)
    root.setProperty('--animation-easing', currentTheme.animations.easing)
  }, [themeId])

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme)
  }

  const currentTheme = themes[themeId]

  return (
    <ThemeContext.Provider value={{ themeId, theme: currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * Hook to get theme from URL parameter
 * Useful for preview/testing different themes
 */
export function useThemeFromURL() {
  const { setTheme } = useTheme()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for ?theme= query parameter
    const params = new URLSearchParams(window.location.search)
    const themeParam = params.get('theme') as ThemeId

    if (themeParam && themes[themeParam]) {
      setTheme(themeParam)
    }
  }, [setTheme])
}
