/**
 * Theme Context
 *
 * Provides theme switching functionality across the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ThemeId, themeMetadata } from '@/design-system/tokens'

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  themeMetadata: typeof themeMetadata
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: ThemeId
}

export function ThemeProvider({ children, defaultTheme = 'theme-c-minimal' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeId>(defaultTheme)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as ThemeId
    if (savedTheme && themeMetadata[savedTheme]) {
      setThemeState(savedTheme)
    }
  }, [])

  // Apply theme to document and save to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('app-theme', theme)
  }, [theme])

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeMetadata }}>
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
    // Check for ?theme= query parameter
    const params = new URLSearchParams(window.location.search)
    const themeParam = params.get('theme') as ThemeId

    if (themeParam && themeMetadata[themeParam]) {
      setTheme(themeParam)
    }
  }, [setTheme])
}
