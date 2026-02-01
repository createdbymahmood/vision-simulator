import type {Map as MapboxMap} from 'mapbox-gl'

const GRID_BACKGROUND = '#F8FAFC'
const GRID_LINE_COLOR = 'rgba(148, 163, 184, 0.3)'

interface GridPatternSpec {
  name: string
  size: number
  step: number
}

const GRID_PATTERNS: GridPatternSpec[] = [
  {name: 'grid-64', size: 64, step: 64},
  {name: 'grid-32', size: 32, step: 32},
  {name: 'grid-16', size: 16, step: 16},
]

const createGridPatternCanvas = (size: number, step: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }

  ctx.fillStyle = GRID_BACKGROUND
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = GRID_LINE_COLOR
  ctx.lineWidth = 1

  for (let i = 0; i <= size; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }

  return {canvas, ctx}
}

export const ensureCanvasGridImages = (map: MapboxMap | null) => {
  if (!map || typeof map.hasImage !== 'function') {
    return
  }
  if (typeof window === 'undefined') {
    return
  }

  GRID_PATTERNS.forEach((pattern) => {
    if (map.hasImage(pattern.name)) {
      return
    }
    const result = createGridPatternCanvas(pattern.size, pattern.step)
    if (!result) {
      return
    }
    const imageData = result.ctx.getImageData(0, 0, pattern.size, pattern.size)
    map.addImage(pattern.name, imageData, {pixelRatio: 1})
  })
}
