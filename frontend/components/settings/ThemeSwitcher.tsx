/**
 * Theme Switcher Component
 *
 * Visual theme picker with previews of all 4 themes
 * Shows theme name, description, and color preview
 */

import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import type { ThemeId } from '@/design-system/themes'

export function ThemeSwitcher() {
  const { themeId, theme, setTheme, themes } = useTheme()

  const themeOptions: { id: ThemeId; emoji: string }[] = [
    { id: 'minimalist', emoji: '✨' },
    { id: 'warm', emoji: '🌅' },
    { id: 'modern', emoji: '⚡' },
    { id: 'playful', emoji: '🎨' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Theme</h3>
        <p className="text-sm text-gray-600">
          Choose your visual style and interaction feel
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {themeOptions.map((option) => {
          const themeData = themes[option.id]
          const isActive = themeId === option.id

          return (
            <motion.button
              key={option.id}
              onClick={() => setTheme(option.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all
                ${
                  isActive
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTheme"
                  className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              )}

              {/* Theme preview */}
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">{option.emoji}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{themeData.name}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{themeData.description}</p>
                </div>
              </div>

              {/* Color palette preview */}
              <div className="flex gap-2">
                <div
                  className="w-8 h-8 rounded-lg shadow-sm"
                  style={{ backgroundColor: themeData.colors.primary }}
                  title="Primary"
                />
                <div
                  className="w-8 h-8 rounded-lg shadow-sm"
                  style={{ backgroundColor: themeData.colors.secondary }}
                  title="Secondary"
                />
                <div
                  className="w-8 h-8 rounded-lg shadow-sm"
                  style={{ backgroundColor: themeData.colors.accent }}
                  title="Accent"
                />
                <div
                  className="w-8 h-8 rounded-lg shadow-sm border border-gray-200"
                  style={{ backgroundColor: themeData.colors.background }}
                  title="Background"
                />
              </div>

              {/* Border radius indicator */}
              <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                <span>Roundness:</span>
                <div
                  className="w-4 h-4 bg-gray-300"
                  style={{ borderRadius: themeData.borderRadius.md }}
                />
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Current theme info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Current theme:</span> {theme.name}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Animation speed: {theme.animations.duration} •
          Hover scale: {theme.animations.hoverScale}x
        </p>
      </div>
    </div>
  )
}
