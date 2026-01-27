/**
 * Theme Switcher Component (For Testing)
 *
 * Simple UI to test theme switching functionality
 */

import { useTheme } from '@/design-system/hooks/useTheme'
import { getAllThemeIds, themeMetadata } from '@/design-system/tokens'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const themes = getAllThemeIds()

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border border-neutral-200">
      <h3 className="text-sm font-semibold text-neutral-900 mb-3">
        Theme Switcher (Testing)
      </h3>
      <div className="space-y-2">
        {themes.map((themeId) => (
          <button
            key={themeId}
            onClick={() => setTheme(themeId)}
            className={`
              w-full px-3 py-2 text-sm rounded-md text-left transition-all
              ${
                theme === themeId
                  ? 'bg-primary-500 text-white font-medium shadow-md'
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
              }
            `}
          >
            <div className="font-medium">{themeMetadata[themeId].name}</div>
            <div className="text-xs opacity-80">
              {themeMetadata[themeId].description}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-neutral-200">
        <p className="text-xs text-neutral-500">
          Current: <span className="font-mono font-medium">{theme}</span>
        </p>
      </div>
    </div>
  )
}
