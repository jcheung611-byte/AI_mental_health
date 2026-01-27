/**
 * Keyboard Shortcuts Hook
 *
 * Power user keyboard shortcuts for desktop
 * - Cmd/Ctrl + K: Focus input
 * - Cmd/Ctrl + /: Show shortcuts help
 * - Cmd/Ctrl + E: Export conversation
 * - Cmd/Ctrl + Shift + Delete: Clear conversation
 * - Escape: Close modals/stop audio
 */

import { useEffect } from 'react'

interface KeyboardShortcutsOptions {
  onFocusInput?: () => void
  onShowHelp?: () => void
  onExport?: () => void
  onClear?: () => void
  onEscape?: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({
  onFocusInput,
  onShowHelp,
  onExport,
  onClear,
  onEscape,
  enabled = true,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl + K: Focus input
      if (modKey && e.key === 'k') {
        e.preventDefault()
        onFocusInput?.()
        return
      }

      // Cmd/Ctrl + /: Show help
      if (modKey && e.key === '/') {
        e.preventDefault()
        onShowHelp?.()
        return
      }

      // Cmd/Ctrl + E: Export
      if (modKey && e.key === 'e') {
        e.preventDefault()
        onExport?.()
        return
      }

      // Cmd/Ctrl + Shift + Delete: Clear
      if (modKey && e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault()
        onClear?.()
        return
      }

      // Escape: Close modals/stop audio
      if (e.key === 'Escape') {
        onEscape?.()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onFocusInput, onShowHelp, onExport, onClear, onEscape])
}

// Keyboard shortcuts reference for UI display
export const KEYBOARD_SHORTCUTS = [
  { key: '⌘ K', description: 'Focus input' },
  { key: '⌘ /', description: 'Show shortcuts' },
  { key: '⌘ E', description: 'Export conversation' },
  { key: '⌘ ⇧ ⌫', description: 'Clear conversation' },
  { key: 'Esc', description: 'Close modals' },
] as const

// Helper to get platform-specific key display
export function getShortcutDisplay(shortcut: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  return isMac ? shortcut : shortcut.replace('⌘', 'Ctrl')
}
