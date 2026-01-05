import {
  CAMERA_COLOR_HUE_SHIFT_DEGREES,
  CAMERA_COLOR_PALETTE,
} from '../constants/camera-colors'

const clampHue = (hue: number) => {
  const normalized = hue % 360
  return normalized < 0 ? normalized + 360 : normalized
}

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '')
  const bigint = Number.parseInt(sanitized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return {r, g, b}
}

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (value: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(value)))
    return clamped.toString(16).padStart(2, '0')
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const rgbToHsl = (r: number, g: number, b: number) => {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min

  let hue = 0
  if (delta !== 0) {
    if (max === rNorm) {
      hue = ((gNorm - bNorm) / delta) % 6
    } else if (max === gNorm) {
      hue = (bNorm - rNorm) / delta + 2
    } else {
      hue = (rNorm - gNorm) / delta + 4
    }
  }

  hue *= 60
  if (hue < 0) {
    hue += 360
  }

  const lightness = (max + min) / 2
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))

  return {hue, saturation, lightness}
}

const hslToRgb = (h: number, s: number, l: number) => {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  const mapToRgb = (hp: number) => {
    if (hp >= 0 && hp < 1) return [c, x, 0]
    if (hp >= 1 && hp < 2) return [x, c, 0]
    if (hp >= 2 && hp < 3) return [0, c, x]
    if (hp >= 3 && hp < 4) return [0, x, c]
    if (hp >= 4 && hp < 5) return [x, 0, c]
    return [c, 0, x]
  }

  const [r, g, b] = mapToRgb(h / 60)
  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255,
  }
}

const shiftHue = (hexColor: string, shiftDegrees: number) => {
  const {r, g, b} = hexToRgb(hexColor)
  const {hue, saturation, lightness} = rgbToHsl(r, g, b)
  const shiftedHue = clampHue(hue + shiftDegrees)
  const {
    r: shiftedR,
    g: shiftedG,
    b: shiftedB,
  } = hslToRgb(shiftedHue, saturation, lightness)
  return rgbToHex(shiftedR, shiftedG, shiftedB)
}

export const assignCameraColor = (index: number) => {
  const paletteSize = CAMERA_COLOR_PALETTE.length
  if (paletteSize === 0) {
    return '#000000'
  }

  const baseColor = CAMERA_COLOR_PALETTE[index % paletteSize]
  const cycle = Math.floor(index / paletteSize)

  if (cycle === 0) {
    return baseColor
  }

  return shiftHue(baseColor, cycle * CAMERA_COLOR_HUE_SHIFT_DEGREES)
}
