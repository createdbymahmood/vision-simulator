import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React, {useEffect, useMemo, useRef} from 'react'

import type {SceneCamera, SceneShape, SceneWall} from '../../core/scene-types'
import type {MovingPerson} from './people-movement'
import type {CameraVision} from './types'

interface Simulation2DViewProps {
  walls: SceneWall[]
  shapes: SceneShape[]
  people: MovingPerson[]
  cameras: SceneCamera[]
  cameraVisions: CameraVision[]
  onReadySnapshot?: (fn: () => Promise<string>) => void
}

export const Simulation2DView: React.FC<Simulation2DViewProps> = ({
  walls,
  shapes,
  people,
  cameras,
  cameraVisions,
  onReadySnapshot,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null)

  const captureSnapshot = useCallbackRef(async () => {
    const svg = svgRef.current
    if (!svg) return ''
    const serializer = new XMLSerializer()
    const rect = svg.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const dpr = window.devicePixelRatio || 1
    const cloned = svg.cloneNode(true) as SVGSVGElement
    cloned.setAttribute('width', `${width}`)
    cloned.setAttribute('height', `${height}`)
    const source = serializer.serializeToString(cloned)
    const svgData = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
    const image = new Image()
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return ''
    }
    const pngDataUrl = await new Promise<string>((resolve) => {
      image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      }
      image.onerror = () => resolve('')
      image.src = svgData
    })
    return pngDataUrl
  })

  useEffect(() => {
    if (onReadySnapshot) {
      onReadySnapshot(captureSnapshot)
    }
  }, [captureSnapshot, onReadySnapshot])

  const fovGradients = useMemo(
    () =>
      cameraVisions.map((vision) => {
        const origin = vision.points[0]
        const radius = vision.points.reduce((max, point) => {
          const dx = point.x - origin.x
          const dy = point.y - origin.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          return Math.max(max, distance)
        }, 0)
        return {
          id: `fov-${vision.id}`,
          origin,
          radius,
        }
      }),
    [cameraVisions],
  )

  const bounds = useMemo(() => {
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
    })
    cameras.forEach((camera) => {
      xs.push(camera.x)
      ys.push(camera.y)
    })
    const minX = Math.min(...xs, -5)
    const maxX = Math.max(...xs, 5)
    const minY = Math.min(...ys, -5)
    const maxY = Math.max(...ys, 5)
    return {minX, maxX, minY, maxY}
  }, [cameras, people, shapes, walls])

  const viewBox = useMemo(() => {
    const width = bounds.maxX - bounds.minX || 10
    const height = bounds.maxY - bounds.minY || 10
    return `${bounds.minX - 1} ${bounds.minY - 1} ${width + 2} ${height + 2}`
  }, [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY])

  const renderWalls = walls.map((wall) => (
    <line
      key={wall.id}
      x1={wall.coordinates.x1}
      x2={wall.coordinates.x2}
      y1={wall.coordinates.y1}
      y2={wall.coordinates.y2}
      stroke={wall.color}
      strokeOpacity={wall.opacity}
      strokeWidth={wall.thickness * 1.5}
    />
  ))

  const renderShapes = shapes.map((shape) => (
    <rect
      height={shape.length}
      width={shape.width}
      fill={shape.color}
      key={shape.id}
      x={shape.x}
      y={shape.y}
      opacity={shape.opacity}
    />
  ))

  const renderPeople = people.map((person) => (
    <circle
      cx={person.x}
      cy={person.y}
      fill='#22c55e'
      key={person.id}
      r={person.radius}
      opacity={0.9}
    />
  ))

  const renderCameras = cameras.map((camera) => (
    <circle
      cx={camera.x}
      cy={camera.y}
      fill='#0ea5e9'
      key={camera.id}
      r={0.45}
      opacity={0.85}
    />
  ))

  return (
    <svg
      className='size-full'
      ref={svgRef}
      preserveAspectRatio='xMidYMid meet'
      viewBox={viewBox}
    >
      <defs>
        {fovGradients.map((gradient) => (
          <radialGradient
            cx={gradient.origin.x}
            cy={gradient.origin.y}
            gradientUnits='userSpaceOnUse'
            id={gradient.id}
            key={gradient.id}
            r={gradient.radius}
          >
            <stop offset='0%' stopColor='#38bdf8' stopOpacity='0.7' />
            <stop offset='50%' stopColor='#38bdf8' stopOpacity='0.6' />
            <stop offset='100%' stopColor='#38bdf8' stopOpacity='0' />
          </radialGradient>
        ))}
      </defs>
      <rect
        height='100%'
        width='100%'
        fill='white'
        x={bounds.minX - 1}
        y={bounds.minY - 1}
        opacity={0.4}
        stroke='#e2e8f0'
      />
      {renderWalls}
      {renderShapes}
      {cameraVisions.map((vision) => (
        <polygon
          fill={`url(#fov-${vision.id})`}
          key={vision.id}
          points={vision.points
            .map((point) => `${point.x},${point.y}`)
            .join(' ')}
        />
      ))}
      {renderPeople}
      {renderCameras}
    </svg>
  )
}

Simulation2DView.displayName = 'simulation-2d-view'
