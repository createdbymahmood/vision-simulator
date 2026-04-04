import React from 'react'

import type {SceneRoot} from '@/features/scene/types/types'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {useSceneStore} from '@/features/scene/state/scene.store'
import {useUiStore} from '@/features/scene/state/ui.store'

import type {CameraFeedTileProps} from './camera-feed-tile'
import type {CameraFeedTarget} from './camera-feed-types'

import {loadCameraFeedTileModule} from './camera-feed-tile-loader'
import {
  computeSceneOrigin,
  createCoordinateTransformer,
} from './simulation-helpers'

interface SimulationCameraSidebarProps {
  scene: SceneRoot
  feedTargets: CameraFeedTarget[]
  focusAreaId?: string
}

const LazyCameraFeedTile = React.lazy(async () => {
  const module = await loadCameraFeedTileModule()
  return {default: module.CameraFeedTile}
})

const CameraFeedTileLoading: React.FC = () => (
  <div className='vs:h-[220px] vs:w-full vs:animate-pulse vs:rounded-md vs:bg-muted/60' />
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
    <div ref={hostRef}>
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

export const SimulationCameraSidebar: React.FC<
  SimulationCameraSidebarProps
> = ({scene, feedTargets, focusAreaId}) => {
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

  return (
    <div className='vs:flex vs:flex-col vs:gap-4 vs:size-full'>
      <Card className='vs:rounded-none vs:border-none vs:p-0 vs:shadow-none vs:gap-0'>
        <CardHeader className='vs:py-2'>
          <CardTitle>Camera Feeds</CardTitle>
        </CardHeader>

        <CardContent className='vs:px-0'>
          <div className='vs:grid vs:gap-2'>
            {feedTargets.map((target) => {
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
                />
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
