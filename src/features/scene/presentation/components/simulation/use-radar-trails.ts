import React from 'react'

import type {SceneRoot} from '@/features/scene/domain/types'
import type {VisionState} from '@/features/scene/infrastructure/stores/ui.store'

import type {RadarPoint, RadarTrailPath} from './simulation-radar-svg'

interface UseRadarTrailsInput {
  scene: SceneRoot
  peopleWorld: VisionState['peopleWorld']
  updatedAt: number
  toRadar: (point: {x: number; z: number}) => RadarPoint
}

export const useRadarTrails = ({
  scene,
  peopleWorld,
  updatedAt,
  toRadar,
}: UseRadarTrailsInput) => {
  const [trailTick, setTrailTick] = React.useState(0)
  const trailsRef = React.useRef<
    Map<string, {points: {x: number; z: number; time: number}[]}>
  >(new Map())

  React.useEffect(() => {
    const now = performance.now()
    scene.people.forEach((person) => {
      const world = peopleWorld[person.id]
      if (!world) {
        return
      }
      const entry = trailsRef.current.get(person.id) ?? {points: []}
      entry.points.push({x: world.x, z: world.z, time: now})
      entry.points = entry.points.filter((point) => now - point.time <= 5000)
      trailsRef.current.set(person.id, entry)
    })
    setTrailTick((prev) => prev + 1)
  }, [peopleWorld, scene.people, updatedAt])

  const trailPaths = React.useMemo<RadarTrailPath[]>(() => {
    const paths: RadarTrailPath[] = []
    trailsRef.current.forEach((trail, id) => {
      if (trail.points.length < 2) {
        return
      }
      const path = trail.points
        .map((point, index) => {
          const pos = toRadar({x: point.x, z: point.z})
          return `${index === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`
        })
        .join(' ')
      paths.push({id, path})
    })
    return paths
  }, [toRadar, trailTick])

  return trailPaths
}
