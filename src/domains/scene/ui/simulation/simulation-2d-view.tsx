import React, {useMemo} from 'react'

import type {SceneCamera, SceneShape, SceneWall} from '../../core/scene-types'
import type {MovingPerson} from './people-movement'
import type {CameraVision} from './types'

interface Simulation2DViewProps {
  walls: SceneWall[]
  shapes: SceneShape[]
  people: MovingPerson[]
  cameras: SceneCamera[]
  cameraVisions: CameraVision[]
}

export const Simulation2DView: React.FC<Simulation2DViewProps> = ({
  walls,
  shapes,
  people,
  cameras,
  cameraVisions,
}) => {
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

  const renderFov = cameraVisions.map((vision) => (
    <polygon
      key={vision.id}
      fill='#38bdf8'
      fillOpacity={0.18}
      points={vision.points.map((point) => `${point.x},${point.y}`).join(' ')}
      stroke='#38bdf8'
      strokeWidth={0.05}
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
    <polygon
      fill='#0ea5e9'
      key={camera.id}
      opacity={0.85}
      points={`${camera.x},${camera.y - 0.5} ${camera.x - 0.4},${
        camera.y + 0.6
      } ${camera.x + 0.4},${camera.y + 0.6}`}
    />
  ))

  return (
    <svg
      className='size-full'
      preserveAspectRatio='xMidYMid meet'
      viewBox={viewBox}
    >
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
      {renderFov}
      {renderPeople}
      {renderCameras}
    </svg>
  )
}

Simulation2DView.displayName = 'simulation-2d-view'
