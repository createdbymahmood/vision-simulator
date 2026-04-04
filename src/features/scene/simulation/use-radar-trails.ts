import React from 'react'

import type {SceneRoot} from '@/features/scene/types/types'
import type {VisionState} from '@/features/scene/state/ui.store'

import type {RadarPoint, RadarTrailPath} from './simulation-radar-svg'

interface UseRadarTrailsInput {
  scene: SceneRoot
  focusAreaId?: string
  peopleWorld: VisionState['peopleWorld']
  updatedAt: number
  toRadar: (point: {x: number; z: number}) => RadarPoint
}

export const useRadarTrails = ({
  scene,
  focusAreaId,
  peopleWorld,
  updatedAt,
  toRadar,
}: UseRadarTrailsInput) => {
  const [trailTick, setTrailTick] = React.useState(0)
  const trailsRef = React.useRef<
    Map<string, {points: {x: number; z: number; time: number}[]}>
  >(new Map())
  const visiblePeople = React.useMemo(
    () =>
      focusAreaId
        ? scene.people.filter((person) => person.areaId === focusAreaId)
        : scene.people,
    [focusAreaId, scene.people],
  )
  const visiblePeopleIds = React.useMemo(
    () => new Set(visiblePeople.map((person) => person.id)),
    [visiblePeople],
  )

  React.useEffect(() => {
    const now = performance.now()
    visiblePeople.forEach((person) => {
      const world = peopleWorld[person.id]
      if (!world) {
        return
      }
      const entry = trailsRef.current.get(person.id) ?? {points: []}
      entry.points.push({x: world.x, z: world.z, time: now})
      entry.points = entry.points.filter((point) => now - point.time <= 5000)
      trailsRef.current.set(person.id, entry)
    })
    trailsRef.current.forEach((_trail, personId) => {
      if (!visiblePeopleIds.has(personId)) {
        trailsRef.current.delete(personId)
      }
    })
    setTrailTick((prev) => prev + 1)
  }, [peopleWorld, updatedAt, visiblePeople, visiblePeopleIds])

  const trailPaths = React.useMemo<RadarTrailPath[]>(() => {
    void trailTick
    const paths: RadarTrailPath[] = []
    trailsRef.current.forEach((trail, id) => {
      if (!visiblePeopleIds.has(id)) {
        return
      }
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
  }, [toRadar, trailTick, visiblePeopleIds])

  return trailPaths
}
