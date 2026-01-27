/**
 * Theme Test Page
 *
 * Simple page to test and demonstrate the 4-theme system
 */

import Head from 'next/head'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { useTheme } from '@/design-system/hooks/useTheme'

export default function ThemeTest() {
  const { theme, themeMetadata } = useTheme()
  const currentTheme = themeMetadata[theme]

  return (
    <>
      <Head>
        <title>Theme System Test - AI Voice Assistant</title>
      </Head>

      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-neutral-900">
              Theme System Test
            </h1>
            <p className="text-lg text-neutral-600">
              Testing the 4-theme design system infrastructure
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              <span>Current Theme:</span>
              <span className="font-bold">{currentTheme.name}</span>
            </div>
          </div>

          {/* Color Palette */}
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-900">
              Color Palette
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {/* Primary */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-600">Primary</p>
                <div className="w-full h-12 bg-primary-500 rounded-md shadow-sm"></div>
                <div className="w-full h-8 bg-primary-300 rounded-md"></div>
                <div className="w-full h-8 bg-primary-700 rounded-md"></div>
              </div>
              {/* Secondary */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-600">Secondary</p>
                <div className="w-full h-12 bg-secondary-500 rounded-md shadow-sm"></div>
                <div className="w-full h-8 bg-secondary-300 rounded-md"></div>
                <div className="w-full h-8 bg-secondary-700 rounded-md"></div>
              </div>
              {/* Accent */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-600">Accent</p>
                <div className="w-full h-12 bg-accent-500 rounded-md shadow-sm"></div>
                <div className="w-full h-8 bg-accent-300 rounded-md"></div>
                <div className="w-full h-8 bg-accent-700 rounded-md"></div>
              </div>
              {/* Success */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-600">Success</p>
                <div className="w-full h-12 bg-success rounded-md shadow-sm"></div>
              </div>
              {/* Error */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-600">Error</p>
                <div className="w-full h-12 bg-error rounded-md shadow-sm"></div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-900">
              Typography
            </h2>
            <div className="space-y-3">
              <p className="text-5xl font-bold text-neutral-900">Heading 1</p>
              <p className="text-3xl font-bold text-neutral-800">Heading 2</p>
              <p className="text-xl font-semibold text-neutral-700">Heading 3</p>
              <p className="text-base text-neutral-600">
                Body text: The quick brown fox jumps over the lazy dog.
              </p>
              <p className="text-sm text-neutral-500">
                Small text: Pack my box with five dozen liquor jugs.
              </p>
            </div>
          </div>

          {/* Components */}
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-900">
              UI Components
            </h2>

            {/* Buttons */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-neutral-700">Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <button className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md font-medium transition-colors shadow-sm">
                  Primary Button
                </button>
                <button className="px-6 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-md font-medium transition-colors shadow-sm">
                  Secondary Button
                </button>
                <button className="px-6 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-md font-medium transition-colors shadow-sm">
                  Accent Button
                </button>
                <button className="px-6 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md font-medium transition-colors">
                  Neutral Button
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-neutral-700">Cards</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h4 className="font-semibold text-primary-700 mb-2">Primary Card</h4>
                  <p className="text-sm text-primary-600">This is a primary themed card component.</p>
                </div>
                <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
                  <h4 className="font-semibold text-secondary-700 mb-2">Secondary Card</h4>
                  <p className="text-sm text-secondary-600">This is a secondary themed card component.</p>
                </div>
                <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
                  <h4 className="font-semibold text-accent-700 mb-2">Accent Card</h4>
                  <p className="text-sm text-accent-600">This is an accent themed card component.</p>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-neutral-700">Form Inputs</h3>
              <div className="space-y-3 max-w-md">
                <input
                  type="text"
                  placeholder="Text input"
                  className="w-full px-4 py-2 border-2 border-neutral-300 focus:border-primary-500 focus:outline-none rounded-md transition-colors"
                />
                <textarea
                  placeholder="Textarea"
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-neutral-300 focus:border-primary-500 focus:outline-none rounded-md transition-colors resize-none"
                />
              </div>
            </div>

            {/* Badges */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-neutral-700">Badges</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  Primary Badge
                </span>
                <span className="px-3 py-1 bg-success text-white rounded-full text-sm font-medium">
                  Success Badge
                </span>
                <span className="px-3 py-1 bg-warning text-white rounded-full text-sm font-medium">
                  Warning Badge
                </span>
                <span className="px-3 py-1 bg-error text-white rounded-full text-sm font-medium">
                  Error Badge
                </span>
              </div>
            </div>
          </div>

          {/* Shadows */}
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-900">
              Shadows & Elevation
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-center h-20">
                <span className="text-sm text-neutral-600">Small</span>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-center h-20">
                <span className="text-sm text-neutral-600">Medium</span>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4 flex items-center justify-center h-20">
                <span className="text-sm text-neutral-600">Large</span>
              </div>
              <div className="bg-white rounded-lg shadow-xl p-4 flex items-center justify-center h-20">
                <span className="text-sm text-neutral-600">XLarge</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-neutral-100 rounded-xl p-6 space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">
              Test Instructions
            </h2>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span>Click the theme buttons in the bottom-right to switch themes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span>Notice how colors, typography, shadows, and spacing change</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span>Theme preference is saved to localStorage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span>You can also use URL parameter: <code className="px-2 py-1 bg-white rounded text-xs">?theme=theme-b-modern</code></span>
              </li>
            </ul>
          </div>

          {/* Back to Home */}
          <div className="text-center pt-4">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-md font-medium transition-colors shadow-md"
            >
              ← Back to Main App
            </a>
          </div>
        </div>

        {/* Theme Switcher (floating) */}
        <ThemeSwitcher />
      </div>
    </>
  )
}
