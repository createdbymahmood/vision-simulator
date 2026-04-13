import React from 'react'

import type {SceneRoot} from '@/features/scene/types/types'

import {useSceneStore} from '@/features/scene/state/scene.store'
import {useUiStore} from '@/features/scene/state/ui.store'

import type {CameraFeedTileProps} from './camera-feed-tile'
import type {CameraFeedTarget} from './camera-feed-types'

import {loadCameraFeedTileModule} from './camera-feed-tile-loader'
import {
  computeSceneOrigin,
  createCoordinateTransformer,
} from './simulation-helpers'

interface SimulationCameraGridViewProps {
  scene: SceneRoot
  feedTargets: CameraFeedTarget[]
  focusAreaId?: string
  gridSize: number
  maxHeight?: string
}

const LazyCameraFeedTile = React.lazy(async () => {
  const module = await loadCameraFeedTileModule()
  return {default: module.CameraFeedTile}
})

const CameraFeedTileLoading: React.FC = () => (
  <div className='vs:h-full vs:w-full vs:animate-pulse vs:rounded-lg vs:bg-muted/60' />
)

const DeferredCameraFeedTile: React.FC<CameraFeedTileProps> = (props) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const [shouldRender, setShouldRender] = React.useState(false)

  React.useEffect(() => {
    if (shouldRender) {
      return
    }

    const hostElement = hostRef.current
    if (!hostElement) {
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setShouldRender(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return
        }
        setShouldRender(true)
        observer.disconnect()
      },
      {rootMargin: '240px 0px'},
    )

    observer.observe(hostElement)

    return () => {
      observer.disconnect()
    }
  }, [shouldRender])

  return (
    <div ref={hostRef} className='vs:min-h-0 vs:min-w-0'>
      {shouldRender ? (
        <React.Suspense fallback={<CameraFeedTileLoading />}>
          <LazyCameraFeedTile {...props} />
        </React.Suspense>
      ) : (
        <CameraFeedTileLoading />
      )}
    </div>
  )
}

export const SimulationCameraGridView: React.FC<
  SimulationCameraGridViewProps
> = ({scene, feedTargets, focusAreaId, gridSize, maxHeight}) => {
  const peopleWorld = useUiStore((state) => state.visionState.peopleWorld)
  const detectionsByCamera = useUiStore(
    (state) => state.visionState.visibleByCameraId,
  )
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)

  const framedScene = React.useMemo(() => {
    if (!focusAreaId) {
      return scene
    }
    return {
      ...scene,
      areas: scene.areas.filter((area) => area.id === focusAreaId),
      walls: scene.walls.filter((wall) => wall.areaId === focusAreaId),
      shapes: scene.shapes.filter((shape) => shape.areaId === focusAreaId),
      cameras: scene.cameras.filter((camera) => camera.areaId === focusAreaId),
      people: scene.people.filter((person) => person.areaId === focusAreaId),
    }
  }, [focusAreaId, scene])
  const originPoint = React.useMemo(
    () => computeSceneOrigin(framedScene),
    [framedScene],
  )
  const transformer = React.useMemo(
    () => createCoordinateTransformer(originPoint),
    [originPoint],
  )
  const selectedPersonIds = React.useMemo(
    () =>
      selectedEntityIds.filter((entityId) => entityId.startsWith('person-')),
    [selectedEntityIds],
  )
  const deferredPeopleWorld = React.useDeferredValue(peopleWorld)
  const deferredDetectionsByCamera = React.useDeferredValue(detectionsByCamera)
  const camerasById = React.useMemo(
    () => new Map(scene.cameras.map((camera) => [camera.id, camera])),
    [scene.cameras],
  )

  const gridSlots = Math.max(gridSize * gridSize, feedTargets.length)
  const gridTemplateColumns = `repeat(${gridSize}, minmax(0, 1fr))`

  if (feedTargets.length === 0) {
    return (
      <div
        className='vs:flex vs:h-full vs:w-full vs:items-center vs:justify-center vs:text-sm vs:text-muted-foreground vs:box-border'
        style={maxHeight ? {maxHeight} : undefined}
      >
        No camera feeds available.
      </div>
    )
  }

  return (
    <div
      className='vs:h-full vs:w-full vs:min-h-0 vs:overflow-hidden vs:p-4 vs:pb-4 vs:box-border'
      style={
        maxHeight
          ? {maxHeight, height: maxHeight}
          : {height: '100%'}
      }
    >
      <div
        className='vs:grid vs:items-stretch vs:gap-4 vs:min-h-0'
        style={{
          gridTemplateColumns,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
          height: '100%',
        }}
      >
        {Array.from({length: gridSlots}).map((_, index) => {
          const target = feedTargets[index]
          if (!target) {
            return (
              <div
                key={`placeholder-${index}`}
                className='vs:flex vs:h-full vs:items-center vs:justify-center vs:rounded-lg vs:border vs:bg-muted/30 vs:text-xs vs:text-muted-foreground'
              >
                No feed
              </div>
            )
          }

          const camera = camerasById.get(target.id)
          if (!camera) {
            return null
          }

          const peopleIds = deferredDetectionsByCamera[camera.id] ?? []

          return (
            <DeferredCameraFeedTile
              camera={camera}
              feedTarget={target}
              key={camera.id}
              feedCount={feedTargets.length}
              peopleIds={peopleIds}
              peopleWorld={deferredPeopleWorld}
              selectedPersonIds={selectedPersonIds}
              transformer={transformer}
              variant='grid'
            />
          )
        })}
      </div>
    </div>
  )
}
