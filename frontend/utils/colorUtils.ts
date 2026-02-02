/**
 * Color Utility Functions
 *
 * Generate shade palettes (50-900) from base colors
 */

/**
 * Generate a shade palette from a base color
 * Creates 50, 100, 200...900 shades
 */
export function generateShades(baseColor: string): Record<string, string> {
  // Parse hex color
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Generate shades by adjusting lightness
  const shades: Record<string, string> = {}

  // 50: Very light (95% lightness)
  shades['50'] = lighten(r, g, b, 0.95)
  // 100: Light (85%)
  shades['100'] = lighten(r, g, b, 0.85)
  // 200: Light (75%)
  shades['200'] = lighten(r, g, b, 0.75)
  // 300: Light (60%)
  shades['300'] = lighten(r, g, b, 0.60)
  // 400: Light-medium (40%)
  shades['400'] = lighten(r, g, b, 0.40)
  // 500: Base color (0% - original)
  shades['500'] = baseColor
  // 600: Dark (-20%)
  shades['600'] = darken(r, g, b, 0.20)
  // 700: Dark (-40%)
  shades['700'] = darken(r, g, b, 0.40)
  // 800: Very dark (-60%)
  shades['800'] = darken(r, g, b, 0.60)
  // 900: Very dark (-75%)
  shades['900'] = darken(r, g, b, 0.75)

  return shades
}

function lighten(r: number, g: number, b: number, amount: number): string {
  const newR = Math.round(r + (255 - r) * amount)
  const newG = Math.round(g + (255 - g) * amount)
  const newB = Math.round(b + (255 - b) * amount)
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
}

function darken(r: number, g: number, b: number, amount: number): string {
  const newR = Math.round(r * (1 - amount))
  const newG = Math.round(g * (1 - amount))
  const newB = Math.round(b * (1 - amount))
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
}

function toHex(value: number): string {
  const hex = Math.max(0, Math.min(255, value)).toString(16)
  return hex.length === 1 ? '0' + hex : hex
}
