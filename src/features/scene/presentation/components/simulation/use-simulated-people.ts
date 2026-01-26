import React from 'react'
import {useFrame} from '@react-three/fiber'
import * as THREE from 'three'

import type {SceneRoot} from '@/features/scene/domain/types'

import type {CoordinateTransformer} from './simulation-helpers'
import {
  buildAreaBoundarySegments,
  buildAreaPolygons,
  buildShapePolygons,
  buildWallSegments,
  createRng,
  getRandomPointInArea,
  hashId,
} from './simulation-people-utils'
import {stepPeopleSimulation, type SimPersonState} from './simulation-people-engine'

const FIXED_STEP = 1 / 30
const PUBLISH_INTERVAL = 0.1
export const useSimulatedPeople = ({
  scene,
  transformer,
}: {
  scene: SceneRoot
  transformer: CoordinateTransformer
}) => {
  const [positions, setPositions] = React.useState<Map<string, THREE.Vector3>>(
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

  useFrame((_, delta) => {
    const state = simRef.current
    state.accumulator += delta

    while (state.accumulator >= FIXED_STEP) {
      state.accumulator -= FIXED_STEP
      stepPeopleSimulation(
        state.people,
        areaPolygons,
        wallSegments,
        shapePolygons,
        FIXED_STEP,
      )
    }

    state.publishTimer += delta
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
    }
  })

  return positions
}
