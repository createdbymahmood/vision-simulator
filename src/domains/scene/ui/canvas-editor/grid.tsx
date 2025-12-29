import type React from 'react'

import {Layer, Line} from 'react-konva'

import type {CanvasPoint, CanvasSize} from './types'

import {GRID_SIZE, GRID_STROKE_COLOR} from './constants'

interface CanvasGridProps {
  size: CanvasSize
  offset: CanvasPoint
  scale: number
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({
  size,
  offset,
  scale,
}) => {
  const cell = GRID_SIZE
  const left = (0 - offset.x) / (cell * scale)
  const right = (size.width - offset.x) / (cell * scale)
  const top = (0 - offset.y) / (cell * scale)
  const bottom = (size.height - offset.y) / (cell * scale)

  const verticalLines: number[] = []
  const horizontalLines: number[] = []

  for (let x = Math.floor(left); x <= Math.ceil(right); x += 1) {
    verticalLines.push(x * cell)
  }
  for (let y = Math.floor(top); y <= Math.ceil(bottom); y += 1) {
    horizontalLines.push(y * cell)
  }

  return (
    <Layer listening={false}>
      {verticalLines.map((x) => (
        <Line
          key={`v-${x}`}
          points={[x, top * cell, x, bottom * cell]}
          stroke={GRID_STROKE_COLOR}
          strokeWidth={1 / scale}
        />
      ))}
      {horizontalLines.map((y) => (
        <Line
          key={`h-${y}`}
          points={[left * cell, y, right * cell, y]}
          stroke={GRID_STROKE_COLOR}
          strokeWidth={1 / scale}
        />
      ))}
      <Line
        points={[0, top * cell, 0, bottom * cell]}
        stroke={GRID_STROKE_COLOR}
        strokeWidth={1 / scale}
      />
      <Line
        points={[left * cell, 0, right * cell, 0]}
        stroke={GRID_STROKE_COLOR}
        strokeWidth={1 / scale}
      />
    </Layer>
  )
}
