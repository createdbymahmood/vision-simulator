import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React, {useEffect, useMemo, useRef} from 'react'

import type {SceneCamera, SceneShape, SceneWall} from '../../core/scene-types'
import type {MovingPerson} from './people-movement'
import type {CameraVision, SimulationViewportHandle} from './types'

import {useElementSize} from '../canvas-editor/hooks'

interface Simulation2DViewProps {
  walls: SceneWall[]
  shapes: SceneShape[]
  people: MovingPerson[]
  cameras: SceneCamera[]
  cameraVisions: CameraVision[]
  selectedPersonId?: string | null
  onSelectPerson?: (id: string) => void
  onViewportReady?: (handle: SimulationViewportHandle) => void
  interactive?: boolean
}

interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface ViewTransform {
  scale: number
  originX: number
  originY: number
}

const rotatePoint = (
  point: {x: number; y: number},
  center: {x: number; y: number},
  angle: number,
) => {
  if (!angle) return point
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = point.x - center.x
  const dy = point.y - center.y
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

const circlePoints = (shape: SceneShape, segments = 48) => {
  const center = {x: shape.x + shape.width / 2, y: shape.y + shape.length / 2}
  const radius = Math.max(Math.min(shape.width, shape.length) / 2, 0.01)
  return Array.from({length: segments}, (_, index) => {
    const angle = (index / segments) * Math.PI * 2
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    }
  })
}

const trianglePoints = (shape: SceneShape) => {
  const center = {x: shape.x + shape.width / 2, y: shape.y + shape.length / 2}
  const radius = Math.max(Math.min(shape.width, shape.length), 0.01) / 2
  const points = Array.from({length: 3}, (_, index) => {
    const angle = -Math.PI / 2 + (index * (2 * Math.PI)) / 3
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    }
  })
  if (!shape.rotation) {
    return points
  }
  return points.map((point) => rotatePoint(point, center, shape.rotation))
}

const lineAsQuadPoints = (shape: SceneShape) => {
  const start = {x: shape.x, y: shape.y}
  const end = {x: shape.x + shape.width, y: shape.y + shape.length}
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.sqrt(dx * dx + dy * dy) || 1
  const halfThickness = (shape.lineThickness || 0.05) / 2
  const nx = (-dy / length) * halfThickness
  const ny = (dx / length) * halfThickness

  const quad = [
    {x: start.x + nx, y: start.y + ny},
    {x: end.x + nx, y: end.y + ny},
    {x: end.x - nx, y: end.y - ny},
    {x: start.x - nx, y: start.y - ny},
  ]

  if (!shape.rotation) {
    return quad
  }
  return quad.map((point) => rotatePoint(point, start, shape.rotation))
}

const rectanglePoints = (shape: SceneShape) => {
  const center = {x: shape.x + shape.width / 2, y: shape.y + shape.length / 2}
  const halfW = shape.width / 2
  const halfL = shape.length / 2
  const corners = [
    {x: center.x - halfW, y: center.y - halfL},
    {x: center.x + halfW, y: center.y - halfL},
    {x: center.x + halfW, y: center.y + halfL},
    {x: center.x - halfW, y: center.y + halfL},
  ]
  if (!shape.rotation) {
    return corners
  }
  return corners.map((corner) => rotatePoint(corner, center, shape.rotation))
}

const shapePolygon = (shape: SceneShape) => {
  if (shape.type === 'circle') return circlePoints(shape)
  if (shape.type === 'triangle') return trianglePoints(shape)
  if (shape.type === 'line') return lineAsQuadPoints(shape)
  return rectanglePoints(shape)
}

const computeBounds = (
  walls: SceneWall[],
  shapes: SceneShape[],
  people: MovingPerson[],
  cameras: SceneCamera[],
  cameraVisions: CameraVision[],
): Bounds => {
  const xs: number[] = []
  const ys: number[] = []

  walls.forEach((wall) => {
    xs.push(wall.coordinates.x1, wall.coordinates.x2)
    ys.push(wall.coordinates.y1, wall.coordinates.y2)
  })

  shapes.forEach((shape) => {
    xs.push(shape.x, shape.x + shape.width)
    ys.push(shape.y, shape.y + shape.length)
  })

  people.forEach((person) => {
    xs.push(person.x)
    ys.push(person.y)
    if (person.trail.length) {
      person.trail.forEach(([trailX, trailY]) => {
        xs.push(trailX)
        ys.push(trailY)
      })
    }
  })

  cameras.forEach((camera) => {
    xs.push(camera.x)
    ys.push(camera.y)
  })

  cameraVisions.forEach((vision) => {
    vision.points.forEach((point) => {
      xs.push(point.x)
      ys.push(point.y)
    })
  })

  const defaultMin = -5
  const defaultMax = 5
  const minX = xs.length ? Math.min(...xs, defaultMin) : defaultMin
  const maxX = xs.length ? Math.max(...xs, defaultMax) : defaultMax
  const minY = ys.length ? Math.min(...ys, defaultMin) : defaultMin
  const maxY = ys.length ? Math.max(...ys, defaultMax) : defaultMax
  return {minX, maxX, minY, maxY}
}

const toScreenPoint = (
  transform: ViewTransform,
  point: {x: number; y: number},
) =>
  ({
    x: (point.x - transform.originX) * transform.scale,
    y: (point.y - transform.originY) * transform.scale,
  }) as const

const prepareCanvasContext = (
  canvas: HTMLCanvasElement,
  size: {width: number; height: number},
): CanvasRenderingContext2D | null => {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(size.width * dpr))
  canvas.height = Math.max(1, Math.round(size.height * dpr))
  canvas.style.width = `${size.width}px`
  canvas.style.height = `${size.height}px`
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, size.width, size.height)
  return ctx
}

const computeViewTransform = (
  size: {width: number; height: number},
  bounds: Bounds,
): ViewTransform => {
  const padding = 2
  const widthSpan = Math.max(bounds.maxX - bounds.minX, 8)
  const heightSpan = Math.max(bounds.maxY - bounds.minY, 8)
  const viewportWidth = widthSpan + padding * 2
  const viewportHeight = heightSpan + padding * 2
  const scale = Math.min(
    size.width / Math.max(viewportWidth, 1),
    size.height / Math.max(viewportHeight, 1),
  )
  const viewWorldWidth = size.width / Math.max(scale, 0.0001)
  const viewWorldHeight = size.height / Math.max(scale, 0.0001)
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  return {
    originX: centerX - viewWorldWidth / 2,
    originY: centerY - viewWorldHeight / 2,
    scale,
  }
}

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  transform: ViewTransform,
  size: {width: number; height: number},
) => {
  const step = 1
  const spanX = size.width / Math.max(transform.scale, 0.0001)
  const spanY = size.height / Math.max(transform.scale, 0.0001)
  const startX = Math.floor(transform.originX / step) * step
  const endX = Math.ceil((transform.originX + spanX) / step) * step
  const startY = Math.floor(transform.originY / step) * step
  const endY = Math.ceil((transform.originY + spanY) / step) * step

  ctx.save()
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()

  for (let x = startX; x <= endX; x += step) {
    const screenX = (x - transform.originX) * transform.scale
    ctx.moveTo(screenX, 0)
    ctx.lineTo(screenX, size.height)
  }
  for (let y = startY; y <= endY; y += step) {
    const screenY = (y - transform.originY) * transform.scale
    ctx.moveTo(0, screenY)
    ctx.lineTo(size.width, screenY)
  }
  ctx.stroke()
  ctx.restore()
}

const buildDetections = (cameraVisions: CameraVision[]) => {
  const lookup = new Map<
    string,
    {visible: boolean; inRange: boolean; inFov: boolean}
  >()
  cameraVisions.forEach((vision) => {
    vision.visiblePeople.forEach((person) => {
      const current = lookup.get(person.id)
      lookup.set(person.id, {
        inFov: person.inFov || current?.inFov || false,
        inRange: person.inRange || current?.inRange || false,
        visible: person.visible || current?.visible || false,
      })
    })
  })
  return lookup
}

const drawWalls = (
  ctx: CanvasRenderingContext2D,
  transform: ViewTransform,
  walls: SceneWall[],
) => {
  walls.forEach((wall) => {
    const start = toScreenPoint(transform, {
      x: wall.coordinates.x1,
      y: wall.coordinates.y1,
    })
    const end = toScreenPoint(transform, {
      x: wall.coordinates.x2,
      y: wall.coordinates.y2,
    })
    ctx.save()
    ctx.strokeStyle = wall.color
    ctx.globalAlpha = wall.opacity
    ctx.lineWidth = Math.max(wall.thickness * transform.scale, 1)
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
    ctx.restore()
  })
}

const drawShapes = (
  ctx: CanvasRenderingContext2D,
  transform: ViewTransform,
  shapes: SceneShape[],
) => {
  shapes.forEach((shape) => {
    const polygon = shapePolygon(shape)
    if (!polygon.length) return
    ctx.save()
    ctx.fillStyle = shape.color
    ctx.globalAlpha = shape.opacity
    ctx.beginPath()
    const first = toScreenPoint(transform, polygon[0]!)
    ctx.moveTo(first.x, first.y)
    polygon.slice(1).forEach((point) => {
      const next = toScreenPoint(transform, point)
      ctx.lineTo(next.x, next.y)
    })
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  })
}

const drawCameraVisions = (
  ctx: CanvasRenderingContext2D,
  transform: ViewTransform,
  cameraVisions: CameraVision[],
) => {
  cameraVisions.forEach((vision) => {
    if (vision.points.length < 3) return
    const origin = toScreenPoint(transform, vision.points[0]!)
    const radius =
      vision.points.reduce((max, point) => {
        const dx = point.x - vision.points[0]!.x
        const dy = point.y - vision.points[0]!.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        return Math.max(max, distance)
      }, 0) * transform.scale
    ctx.save()
    const gradient = ctx.createRadialGradient(
      origin.x,
      origin.y,
      0,
      origin.x,
      origin.y,
      Math.max(radius, 8),
    )
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.6)')
    gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.42)')
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(origin.x, origin.y)
    vision.points.slice(1).forEach((point) => {
      const mapped = toScreenPoint(transform, point)
      ctx.lineTo(mapped.x, mapped.y)
    })
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  })
}

const drawCameras = (
  ctx: CanvasRenderingContext2D,
  transform: ViewTransform,
  cameras: SceneCamera[],
) => {
  cameras.forEach((camera) => {
    const center = toScreenPoint(transform, {x: camera.x, y: camera.y})
    const sizeUnits = 0.9 * transform.scale
    ctx.save()
    ctx.fillStyle = '#0ea5e9'
    ctx.globalAlpha = 0.9
    ctx.fillRect(
      center.x - sizeUnits / 2,
      center.y - sizeUnits / 2,
      sizeUnits,
      sizeUnits,
    )
    ctx.restore()
  })
}

const drawPeople = (
  ctx: CanvasRenderingContext2D,
  transform: ViewTransform,
  people: MovingPerson[],
  detectionLookup: Map<
    string,
    {visible: boolean; inRange: boolean; inFov: boolean}
  >,
  selectedPersonId: string | null,
) => {
  people.forEach((person) => {
    const position = toScreenPoint(transform, {x: person.x, y: person.y})
    const radius = Math.max(person.radius * transform.scale, 2)
    const detection = detectionLookup.get(person.id)
    const detected = Boolean(detection?.visible)
    const isSelected = selectedPersonId === person.id

    if (person.trailEnabled && person.trail.length && isSelected) {
      ctx.save()
      ctx.strokeStyle = '#22c55e'
      ctx.globalAlpha = 0.9
      ctx.lineWidth = Math.max(2, transform.scale * 0.08)
      ctx.beginPath()
      person.trail.forEach(([x, y], index) => {
        const point = toScreenPoint(transform, {x, y})
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()
      ctx.restore()
    }

    ctx.save()
    ctx.fillStyle = detected ? '#16a34a' : '#9ca3af'
    ctx.globalAlpha = detected ? 0.95 : 0.8
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = isSelected ? '#a855f7' : detected ? '#22c55e' : '#cbd5e1'
    ctx.lineWidth = isSelected ? 3 : 1.5
    ctx.stroke()
    ctx.restore()
  })
}

const renderScene = (params: {
  ctx: CanvasRenderingContext2D
  transform: ViewTransform
  size: {width: number; height: number}
  walls: SceneWall[]
  shapes: SceneShape[]
  cameras: SceneCamera[]
  cameraVisions: CameraVision[]
  people: MovingPerson[]
  detectionLookup: Map<
    string,
    {visible: boolean; inRange: boolean; inFov: boolean}
  >
  selectedPersonId: string | null
}) => {
  const {
    ctx,
    transform,
    size,
    walls,
    shapes,
    cameras,
    cameraVisions,
    people,
    detectionLookup,
    selectedPersonId,
  } = params

  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, size.width, size.height)
  drawGrid(ctx, transform, {width: size.width, height: size.height})
  drawWalls(ctx, transform, walls)
  drawShapes(ctx, transform, shapes)
  drawCameraVisions(ctx, transform, cameraVisions)
  drawCameras(ctx, transform, cameras)
  drawPeople(ctx, transform, people, detectionLookup, selectedPersonId)
}

const findClosestPerson = (
  people: MovingPerson[],
  worldPoint: {x: number; y: number},
): string | null => {
  let closest: {id: string; distance: number} | null = null
  people.forEach((person) => {
    const distance = Math.hypot(
      person.x - worldPoint.x,
      person.y - worldPoint.y,
    )
    const radiusAllowance = Math.max(person.radius, 0.35)
    if (distance <= radiusAllowance) {
      if (!closest || distance < closest.distance) {
        closest = {distance, id: person.id}
      }
    }
  })
  return (closest as {id: string} | null)?.id ?? null
}

export const Simulation2DView: React.FC<Simulation2DViewProps> = ({
  walls,
  shapes,
  people,
  cameras,
  cameraVisions,
  selectedPersonId = null,
  onSelectPerson,
  onViewportReady,
  interactive = true,
}) => {
  const [containerRef, size] = useElementSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const transformRef = useRef<ViewTransform | null>(null)

  const detectionLookup = useMemo(
    () => buildDetections(cameraVisions),
    [cameraVisions],
  )

  const captureSnapshot = useCallbackRef(
    async (scale: number): Promise<string> => {
      const canvas = canvasRef.current
      if (!canvas) {
        return ''
      }
      const baseDataUrl = canvas.toDataURL('image/png')
      const normalizedScale = Math.max(1, Math.round(scale))
      if (normalizedScale === 1) {
        return baseDataUrl
      }
      const scaledCanvas = document.createElement('canvas')
      scaledCanvas.width = Math.max(
        1,
        Math.round(canvas.width * normalizedScale),
      )
      scaledCanvas.height = Math.max(
        1,
        Math.round(canvas.height * normalizedScale),
      )
      const ctx = scaledCanvas.getContext('2d')
      if (!ctx) {
        return baseDataUrl
      }
      await new Promise<void>((resolve) => {
        const image = new Image()
        image.onload = () => {
          ctx.drawImage(image, 0, 0, scaledCanvas.width, scaledCanvas.height)
          resolve()
        }
        image.onerror = () => resolve()
        image.src = baseDataUrl
      })
      return scaledCanvas.toDataURL('image/png')
    },
  )

  useEffect(() => {
    if (!onViewportReady || !canvasRef.current) {
      return
    }
    onViewportReady({
      getSnapshot: captureSnapshot,
      getStream: () => {
        const canvas = canvasRef.current
        return canvas ? canvas.captureStream(60) : null
      },
    })
  }, [captureSnapshot, onViewportReady])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !size.width || !size.height) {
      return
    }
    const ctx = prepareCanvasContext(canvas, size)
    if (!ctx) {
      return
    }

    const bounds = computeBounds(walls, shapes, people, cameras, cameraVisions)
    const transform = computeViewTransform(size, bounds)
    transformRef.current = transform

    renderScene({
      cameras,
      cameraVisions,
      ctx,
      detectionLookup,
      people,
      selectedPersonId,
      shapes,
      size,
      transform,
      walls,
    })
  }, [
    cameraVisions,
    cameras,
    detectionLookup,
    people,
    selectedPersonId,
    shapes,
    size.height,
    size.width,
    walls,
  ])

  const handleClick = useCallbackRef(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive || !onSelectPerson) {
        return
      }
      const canvas = canvasRef.current
      const transform = transformRef.current
      if (!canvas || !transform) {
        return
      }
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const worldX = x / transform.scale + transform.originX
      const worldY = y / transform.scale + transform.originY
      const closestId = findClosestPerson(people, {x: worldX, y: worldY})
      if (closestId) {
        onSelectPerson(closestId)
      }
    },
  )

  return (
    <div className='size-full' ref={containerRef}>
      <canvas className='h-full w-full' ref={canvasRef} onClick={handleClick} />
    </div>
  )
}

Simulation2DView.displayName = 'simulation-2d-view'
