import {useFrame} from '@react-three/fiber'
import React from 'react'
import * as THREE from 'three'

import type {SceneRoot} from '@/features/scene/types/types'

import type {CoordinateTransformer} from './simulation-helpers'
import type {SimPersonState} from './simulation-people-engine'

import {stepPeopleSimulation} from './simulation-people-engine'
import {
  buildAreaBoundarySegments,
  buildAreaPolygons,
  buildShapePolygons,
  buildWallSegments,
  createRng,
  getRandomPointInArea,
  hashId,
} from './simulation-people-utils'

const FIXED_STEP = 1 / 60
const PUBLISH_INTERVAL = FIXED_STEP
const MAX_STEPS_PER_FRAME = 10
const MAX_ACCUMULATOR = FIXED_STEP * MAX_STEPS_PER_FRAME
export const useSimulatedPeople = ({
  scene,
  transformer,
  paused = false,
}: {
  scene: SceneRoot
  transformer: CoordinateTransformer
  paused?: boolean
}) => {
  const [positions, setPositions] = React.useState<Map<string, THREE.Vector3>>(
    () => new Map(),
  )
  const [velocities, setVelocities] = React.useState<Map<string, THREE.Vector3>>(
    () => new Map(),
  )
  const simRef = React.useRef<{
    people: Map<string, SimPersonState>
    accumulator: number
    publishTimer: number
  }>({people: new Map(), accumulator: 0, publishTimer: 0})

  const areaPolygons = React.useMemo(
    () => buildAreaPolygons(scene.areas, transformer),
    [scene.areas, transformer],
  )
  const areaBoundarySegments = React.useMemo(
    () => buildAreaBoundarySegments(scene.areas, transformer),
    [scene.areas, transformer],
  )
  const wallSegments = React.useMemo(
    () => [
      ...buildWallSegments(scene.walls, transformer),
      ...areaBoundarySegments,
    ],
    [areaBoundarySegments, scene.walls, transformer],
  )
  const shapePolygons = React.useMemo(
    () => buildShapePolygons(scene.shapes, transformer),
    [scene.shapes, transformer],
  )

  React.useEffect(() => {
    const map = new Map<string, SimPersonState>()
    scene.people.forEach((person) => {
      const area = areaPolygons.get(person.areaId)
      if (!area) {
        return
      }
      const seed = scene.simulationSeed + hashId(person.id)
      const rng = createRng(seed)
      const position = transformer.toVector3([person.x, person.y], 0)
      const target = getRandomPointInArea(area, rng)
      map.set(person.id, {
        id: person.id,
        areaId: person.areaId,
        position,
        velocity: new THREE.Vector3(),
        target,
        speed: Math.max(person.speed, 0.5),
        height: person.height,
        rng,
      })
    })
    simRef.current = {people: map, accumulator: 0, publishTimer: 0}
    setPositions(
      new Map(
        [...map.values()].map((person) => [person.id, person.position.clone()]),
      ),
    )
  }, [areaPolygons, scene.people, scene.simulationSeed, transformer])

  React.useEffect(() => {
    if (!paused) {
      return
    }
    simRef.current.accumulator = 0
    simRef.current.publishTimer = 0
  }, [paused])

  useFrame((_, delta) => {
    if (paused) {
      return
    }
    const clampedDelta = Math.min(delta, MAX_ACCUMULATOR)
    const state = simRef.current
    state.accumulator = Math.min(
      state.accumulator + clampedDelta,
      MAX_ACCUMULATOR,
    )

    let steps = 0
    while (state.accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
      state.accumulator -= FIXED_STEP
      stepPeopleSimulation(
        state.people,
        areaPolygons,
        wallSegments,
        shapePolygons,
        FIXED_STEP,
      )
      steps += 1
    }

    state.publishTimer += clampedDelta
    if (state.publishTimer >= PUBLISH_INTERVAL) {
      state.publishTimer = 0
      setPositions(
        new Map(
          [...state.people.values()].map((person) => [
            person.id,
            person.position.clone(),
          ]),
        ),
      )
      setVelocities(
        new Map(
          [...state.people.values()].map((person) => [
            person.id,
            person.velocity.clone(),
          ]),
        ),
      )
    }
  })

  return {positions, velocities}
}
