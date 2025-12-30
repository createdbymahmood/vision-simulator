import React, {useMemo} from 'react'

import type {
  SceneCamera,
  ScenePerson,
  SceneShape,
  SceneWall,
} from '../../core/scene-types'

interface SimulationMiniMapProps {
  walls: SceneWall[]
  shapes: SceneShape[]
  people: ScenePerson[]
  cameras: SceneCamera[]
}

export const SimulationMiniMap: React.FC<SimulationMiniMapProps> = ({
  walls,
  shapes,
  people,
  cameras,
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
      stroke='#0f172a'
      strokeWidth={wall.thickness * 1.5}
    />
  ))

  const renderShapes = shapes.map((shape) => (
    <rect
      height={shape.length}
      width={shape.width}
      fill='#94a3b8'
      key={shape.id}
      x={shape.x}
      y={shape.y}
      opacity={0.7}
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
    <div className='rounded-lg border bg-muted p-3'>
      <div className='mb-2 text-sm font-medium text-muted-foreground'>
        2D Mini View
      </div>
      <svg
        className='h-56 w-full'
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
        {renderPeople}
        {renderCameras}
      </svg>
    </div>
  )
}

SimulationMiniMap.displayName = 'simulation-mini-map'
