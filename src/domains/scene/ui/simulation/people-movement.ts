import {useEffect, useRef, useState} from 'react'

import type {ScenePerson, SceneShape, SceneWall} from '../../core/scene-types'

export interface Obstacle {
  x: number
  y: number
  width: number
  length: number
}

export type MovingPerson = ScenePerson & {
  velocity: [number, number]
  trail: number[][]
}

const PERSON_SPEED = 0.8
const COLLISION_PADDING = 0.2

const normalizeVelocity = (vx: number, vy: number) => {
  const magnitude = Math.hypot(vx, vy) || 1
  return [(vx / magnitude) * PERSON_SPEED, (vy / magnitude) * PERSON_SPEED] as [
    number,
    number,
  ]
}

const collides = (
  x: number,
  y: number,
  radius: number,
  obstacles: Obstacle[],
  current: MovingPerson[],
  idx: number,
) => {
  const hitsObstacle = obstacles.some((obstacle) => {
    const minX = obstacle.x - radius - COLLISION_PADDING
    const maxX = obstacle.x + obstacle.width + radius + COLLISION_PADDING
    const minY = obstacle.y - radius - COLLISION_PADDING
    const maxY = obstacle.y + obstacle.length + radius + COLLISION_PADDING
    return x >= minX && x <= maxX && y >= minY && y <= maxY
  })
  if (hitsObstacle) {
    return true
  }
  return current.some((other, otherIdx) => {
    if (otherIdx === idx) {
      return false
    }
    const dx = other.x - x
    const dy = other.y - y
    const distance = Math.hypot(dx, dy)
    return distance < (other.radius || radius) + radius + COLLISION_PADDING
  })
}

const updateTrail = (
  trail: number[][],
  x: number,
  y: number,
  now: number,
  reset: boolean,
) => {
  const baseTrail = reset ? [] : trail
  const lastPoint = baseTrail[baseTrail.length - 1]
  const distanceFromLast = lastPoint
    ? Math.hypot(x - lastPoint[0], y - lastPoint[1])
    : 0
  const freshTrail = distanceFromLast > 2 ? [] : baseTrail // avoid long razor lines
  const nextTrail = [...freshTrail, [x, y, now]]
  const cutoff = now - 20000
  return nextTrail.filter(([, , timestamp]) => timestamp >= cutoff)
}

export const initializePeopleState = (people: ScenePerson[]): MovingPerson[] =>
  people.map((person, index) => ({
    ...person,
    velocity: [Math.sin(index) * 0.5, Math.cos(index) * 0.5],
    trail: [],
  }))

export const advancePeopleState = (
  current: MovingPerson[],
  obstacles: Obstacle[],
  delta: number,
  timeNow: number,
): MovingPerson[] =>
  current.map((person, idx) => {
    const [vx, vy] = normalizeVelocity(
      person.velocity[0] || PERSON_SPEED,
      person.velocity[1] || PERSON_SPEED,
    )
    const radius = person.radius || 0.3
    const nextPosition = (nextVx: number, nextVy: number) => ({
      x: person.x + nextVx * delta,
      y: person.y + nextVy * delta,
    })

    let nextVx = vx
    let nextVy = vy
    let {x: nextX, y: nextY} = nextPosition(nextVx, nextVy)
    let collided = false

    if (collides(nextX, nextY, radius, obstacles, current, idx)) {
      collided = true
      const turnRight = (idx + Math.floor(timeNow)) % 2 === 0
      const rotatedVx = turnRight ? -nextVy : nextVy
      const rotatedVy = turnRight ? nextVx : -nextVx
      nextVx = rotatedVx
      nextVy = rotatedVy
      const jitter = (idx * 0.13 + timeNow * 0.001) * 0.05
      const adjustedVx = nextVx + Math.cos(jitter) * 0.05
      const adjustedVy = nextVy + Math.sin(jitter) * 0.05
      const [normalizedVx, normalizedVy] = normalizeVelocity(
        adjustedVx,
        adjustedVy,
      )
      nextVx = normalizedVx
      nextVy = normalizedVy
      const reversed = nextPosition(nextVx, nextVy)
      nextX = reversed.x
      nextY = reversed.y
    }

    return {
      ...person,
      x: nextX,
      y: nextY,
      velocity: [nextVx, nextVy],
      trail: person.trailEnabled
        ? updateTrail(person.trail, nextX, nextY, timeNow, collided)
        : [],
    }
  })

export const usePeopleMovement = (
  people: ScenePerson[],
  obstacles: Obstacle[],
) => {
  const [state, setState] = useState<MovingPerson[]>(() =>
    initializePeopleState(people),
  )
  const obstaclesRef = useRef(obstacles)

  useEffect(() => {
    obstaclesRef.current = obstacles
  }, [obstacles])

  useEffect(() => {
    setState(initializePeopleState(people))
  }, [people])

  useEffect(() => {
    let frameId: number
    let last = performance.now()
    const step = () => {
      const now = performance.now()
      const delta = Math.min((now - last) / 1000, 0.1)
      last = now
      setState((current) =>
        advancePeopleState(current, obstaclesRef.current, delta, now),
      )
      frameId = requestAnimationFrame(step)
    }
    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return state
}

export const buildObstacles = (
  shapes: SceneShape[],
  walls: SceneWall[],
): Obstacle[] => [
  ...shapes.map((shape) => ({
    x: shape.x,
    y: shape.y,
    width: shape.width,
    length: shape.length,
  })),
  ...walls.map((wall) => ({
    x: Math.min(wall.coordinates.x1, wall.coordinates.x2),
    y: Math.min(wall.coordinates.y1, wall.coordinates.y2),
    width: Math.abs(wall.coordinates.x2 - wall.coordinates.x1),
    length: Math.abs(wall.coordinates.y2 - wall.coordinates.y1),
  })),
]
