import * as THREE from 'three'

import type {
  AreaPolygon,
  ObstaclePolygon,
  ObstacleSegment,
} from './simulation-people-utils'

import {
  distanceToSegment,
  getRandomPointInArea,
  isPointInPolygon,
} from './simulation-people-utils'

const TARGET_REACHED_DISTANCE = 0.5
const PERSON_AVOID_DISTANCE = 1.2

export interface SimPersonState {
  id: string
  areaId: string
  position: THREE.Vector3
  velocity: THREE.Vector3
  target: THREE.Vector3
  speed: number
  height: number
  rng: () => number
}

export const resolveNextTarget = (
  person: SimPersonState,
  area: AreaPolygon,
  walls: ObstacleSegment[],
  shapes: ObstaclePolygon[],
) => {
  const maxAttempts = 20
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = getRandomPointInArea(area, person.rng)
    const blockedByWall = walls.some(
      (wall) =>
        wall.areaId === person.areaId &&
        wall.height >= person.height &&
        distanceToSegment(candidate, wall.a, wall.b) < wall.thickness / 2,
    )
    if (blockedByWall) {
      continue
    }
    const blockedByShape = shapes.some(
      (shape) =>
        shape.areaId === person.areaId &&
        shape.height >= person.height &&
        isPointInPolygon(candidate, shape.points),
    )
    if (blockedByShape) {
      continue
    }
    return candidate
  }
  return person.position.clone()
}

export const stepPeopleSimulation = (
  people: Map<string, SimPersonState>,
  areaPolygons: Map<string, AreaPolygon>,
  wallSegments: ObstacleSegment[],
  shapePolygons: ObstaclePolygon[],
  delta: number,
) => {
  people.forEach((person) => {
    const area = areaPolygons.get(person.areaId)
    if (!area) {
      return
    }
    if (person.position.distanceTo(person.target) < TARGET_REACHED_DISTANCE) {
      person.target = resolveNextTarget(
        person,
        area,
        wallSegments,
        shapePolygons,
      )
    }

    const desired = new THREE.Vector3()
      .subVectors(person.target, person.position)
      .setY(0)
      .normalize()
      .multiplyScalar(person.speed)

    people.forEach((other) => {
      if (other.id === person.id) {
        return
      }
      const distance = other.position.distanceTo(person.position)
      if (distance > 0 && distance < PERSON_AVOID_DISTANCE) {
        const repulse = new THREE.Vector3()
          .subVectors(person.position, other.position)
          .setY(0)
          .normalize()
          .multiplyScalar((PERSON_AVOID_DISTANCE - distance) * 0.8)
        desired.add(repulse)
      }
    })

    const nextPosition = person.position
      .clone()
      .add(desired.multiplyScalar(delta))

    if (!isPointInPolygon(nextPosition, area.points)) {
      person.target = resolveNextTarget(
        person,
        area,
        wallSegments,
        shapePolygons,
      )
      return
    }

    const blockedByWall = wallSegments.some(
      (wall) =>
        wall.areaId === person.areaId &&
        wall.height >= person.height &&
        distanceToSegment(nextPosition, wall.a, wall.b) < wall.thickness / 2,
    )
    if (blockedByWall) {
      person.target = resolveNextTarget(
        person,
        area,
        wallSegments,
        shapePolygons,
      )
      return
    }

    const blockedByShape = shapePolygons.some(
      (shape) =>
        shape.areaId === person.areaId &&
        shape.height >= person.height &&
        isPointInPolygon(nextPosition, shape.points),
    )
    if (blockedByShape) {
      person.target = resolveNextTarget(
        person,
        area,
        wallSegments,
        shapePolygons,
      )
      return
    }

    person.position.copy(nextPosition)
    person.velocity.copy(desired)
  })
}
