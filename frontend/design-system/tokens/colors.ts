/**
 * Color Design Tokens
 *
 * Defines color palettes for all 4 themes:
 * - Theme A: Warm & Calming with Energy
 * - Theme B: Modern & Alive
 * - Theme C: Minimalist & Focused
 * - Theme D: Playful & Human
 */

export const baseColors = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
}

export type ThemeId = 'theme-a-warm' | 'theme-b-modern' | 'theme-c-minimal' | 'theme-d-playful'

export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

export interface ThemeColors {
  primary: ColorScale
  secondary: ColorScale
  accent: ColorScale
  neutral: ColorScale
  success: string
  warning: string
  error: string
  info: string
}

export const themeColors: Record<ThemeId, ThemeColors> = {
  'theme-a-warm': {
    // Theme A: Warm & Calming with Energy
    // Primary: Sunset oranges & soft peaches
    primary: {
      50: '#FFF5F0',
      100: '#FFE6D9',
      200: '#FFCDB3',
      300: '#FFB38C',
      400: '#FF9A66',
      500: '#FF8F5C', // Main brand color
      600: '#FF7B47',
      700: '#FF6733',
      800: '#E65020',
      900: '#D93900',
    },
    // Secondary: Warm purples & lavenders
    secondary: {
      50: '#F7F3FF',
      100: '#EDE6FF',
      200: '#DAD0FF',
      300: '#C6B7FF',
      400: '#B39EFF',
      500: '#B78BF0', // Warm purple
      600: '#A07AD9',
      700: '#8A69C2',
      800: '#6B46A8',
      900: '#4F2E7D',
    },
    // Accent: Golden yellow
    accent: {
      50: '#FFFBEB',
      100: '#FFF3CC',
      200: '#FFEBB3',
      300: '#FFE399',
      400: '#FFDB80',
      500: '#FFD166', // Golden yellow
      600: '#FFC947',
      700: '#FFB524',
      800: '#E69F00',
      900: '#CC8900',
    },
    // Neutral: Warm grays with peachy tint
    neutral: {
      50: '#FDFBF9',
      100: '#F7F4F1',
      200: '#E8E3DE',
      300: '#D6CFC7',
      400: '#B5ACA1',
      500: '#8A8079',
      600: '#6E6760',
      700: '#5C5550',
      800: '#3D3832',
      900: '#2A2420',
    },
    success: '#6FCF97',
    warning: '#F2994A',
    error: '#EB5757',
    info: '#56CCF2',
  },

  'theme-b-modern': {
    // Theme B: Modern & Alive
    // Primary: Electric blues & cyans
    primary: {
      50: '#E6F7FF',
      100: '#BAEAFF',
      200: '#7DD8FF',
      300: '#38C3FF',
      400: '#0EB1FF',
      500: '#0EA5E9', // Sky blue
      600: '#0284C7',
      700: '#0369A1',
      800: '#075985',
      900: '#0C4A6E',
    },
    // Secondary: Vibrant purples
    secondary: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6', // Vibrant purple
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },
    // Accent: Hot pink
    accent: {
      50: '#FDF2F8',
      100: '#FCE7F3',
      200: '#FBCFE8',
      300: '#F9A8D4',
      400: '#F472B6',
      500: '#EC4899', // Hot pink
      600: '#DB2777',
      700: '#BE185D',
      800: '#9F1239',
      900: '#831843',
    },
    // Neutral: Cool grays
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
  },

  'theme-c-minimal': {
    // Theme C: Minimalist & Focused
    // Primary: Refined blues
    primary: {
      50: '#F0F4F8',
      100: '#D9E2EC',
      200: '#BCCCDC',
      300: '#9FB3C8',
      400: '#829AB1',
      500: '#3B82F6', // Subtle blue
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    // Secondary: Slate
    secondary: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B', // Slate
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    // Accent: Minimal green
    accent: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E', // Success green
      600: '#16A34A',
      700: '#15803D',
      800: '#166534',
      900: '#14532D',
    },
    // Neutral: True grays with high contrast
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
    info: '#3B82F6',
  },

  'theme-d-playful': {
    // Theme D: Playful & Human
    // Primary: Friendly blues
    primary: {
      50: '#EEF6FF',
      100: '#D9EBFF',
      200: '#B8DCFF',
      300: '#8AC7FF',
      400: '#5AAFFF',
      500: '#4A9FF5', // Approachable blue
      600: '#3B8ADB',
      700: '#2C75C1',
      800: '#2360A7',
      900: '#1E50A7',
    },
    // Secondary: Warm coral
    secondary: {
      50: '#FFF4ED',
      100: '#FFE4D4',
      200: '#FFC9A9',
      300: '#FFAC7D',
      400: '#FF9472', // Warm coral
      500: '#FF7F5C',
      600: '#FF6B47',
      700: '#F55633',
      800: '#E85D3D',
      900: '#CC4A2B',
    },
    // Accent: Cheerful yellow
    accent: {
      50: '#FFFAEB',
      100: '#FFF3C7',
      200: '#FFEBA3',
      300: '#FFE280',
      400: '#FFD95D',
      500: '#FFC849', // Cheerful yellow
      600: '#FFB524',
      700: '#FF9F00',
      800: '#E68A00',
      900: '#CC7700',
    },
    // Neutral: Soft, warm grays
    neutral: {
      50: '#FAFAF9',
      100: '#F5F5F3',
      200: '#E7E6E3',
      300: '#D4D2CD',
      400: '#A8A59D',
      500: '#78736D',
      600: '#5C5750',
      700: '#4A4641',
      800: '#37342F',
      900: '#2B2825',
    },
    success: '#5FCC7F',
    warning: '#FFB84D',
    error: '#FF6B6B',
    info: '#6BBAFF',
  },
}

/**
 * Get colors for a specific theme
 */
export function getThemeColors(themeId: ThemeId): ThemeColors {
  return themeColors[themeId]
}

/**
 * Get all theme IDs
 */
export function getAllThemeIds(): ThemeId[] {
  return Object.keys(themeColors) as ThemeId[]
}
