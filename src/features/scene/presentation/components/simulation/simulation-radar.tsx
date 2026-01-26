import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import type {SceneRoot} from '@/features/scene/domain/types'

import {Card, CardContent, CardFooter} from '@/components/ui/card'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

import {
  computeSceneOrigin,
  createCoordinateTransformer,
} from './simulation-helpers'
import {SimulationRadarHeader} from './simulation-radar-header'
import {SimulationRadarSvg} from './simulation-radar-svg'
import {useRadarGeometry} from './use-radar-geometry'
import {useRadarInteractions} from './use-radar-interactions'
import {useRadarTrails} from './use-radar-trails'

interface SimulationRadarProps {
  scene: SceneRoot
  selectedEntityIds: string[]
  onSelectEntity: (id?: string) => void
  containerRef?: React.RefObject<HTMLDivElement>
}

// eslint-disable-next-line max-lines-per-function
export const SimulationRadar: React.FC<SimulationRadarProps> = ({
  scene,
  selectedEntityIds,
  onSelectEntity,
  containerRef,
}) => {
  const radarSettings = useUiStore((state) => state.radarSettings)
  const setRadarSettings = useUiStore((state) => state.setRadarSettings)
  const visionState = useUiStore((state) => state.visionState)
  const activeCameraId = useUiStore((state) => state.activeCameraId)
  const setActiveCameraId = useUiStore((state) => state.setActiveCameraId)

  const selectedPersonId = React.useMemo(
    () => selectedEntityIds.find((id) => id.startsWith('person-')),
    [selectedEntityIds],
  )

  const originPoint = React.useMemo(() => computeSceneOrigin(scene), [scene])
  const transformer = React.useMemo(
    () => createCoordinateTransformer(originPoint),
    [originPoint],
  )

  const peopleWorld = visionState.peopleWorld
  const cameraDetections = visionState.visibleByCameraId

  const {
    areaPaths,
    cameraMarkers,
    connections,
    gridLines,
    peopleMarkers,
    toRadar,
    wedges,
  } = useRadarGeometry({
    scene,
    radarSettings,
    transformer,
    peopleWorld,
    cameraDetections,
  })

  const trailPaths = useRadarTrails({
    scene,
    peopleWorld,
    updatedAt: visionState.updatedAt,
    toRadar,
  })

  const [pingKey, setPingKey] = React.useState(0)
  const [pingPersonId, setPingPersonId] = React.useState<string | null>(null)
  const [hoveredCameraId, setHoveredCameraId] = React.useState<string | null>(
    null,
  )

  React.useEffect(() => {
    if (selectedPersonId) {
      setPingPersonId(selectedPersonId)
      setPingKey((prev) => prev + 1)
    }
  }, [selectedPersonId])

  const handleToggleMinimize = useCallbackRef(() => {
    setRadarSettings({isMinimized: !radarSettings.isMinimized})
  })

  const handleCameraHover = useCallbackRef((cameraId?: string) => {
    setHoveredCameraId(cameraId ?? null)
  })
  const {handlePanStart, handleResizeStart, handleWheel} = useRadarInteractions(
    {
      radarSettings,
      setRadarSettings,
      containerRef,
    },
  )

  const pingPoint = React.useMemo(() => {
    if (!pingPersonId) {
      return null
    }
    const world = peopleWorld[pingPersonId]
    if (!world) {
      return null
    }
    return toRadar({x: world.x, z: world.z})
  }, [peopleWorld, pingPersonId, toRadar])

  return (
    <div className='pointer-events-auto w-full'>
      <div
        className={`${radarSettings.isMinimized ? 'w-full' : 'h-full w-full'} `}
      >
        <Card className='w-full'>
          <SimulationRadarHeader
            isMinimized={radarSettings.isMinimized}
            onToggleMinimize={handleToggleMinimize}
          />
          {!radarSettings.isMinimized ? (
            <>
              <CardContent className='p-0 overflow-hidden'>
                <div
                  className='relative overflow-hidden'
                  onPointerDown={handlePanStart}
                  onWheel={handleWheel}
                >
                  <SimulationRadarSvg
                    size={radarSettings.size}
                    activeCameraId={activeCameraId}
                    areaPaths={areaPaths}
                    cameraMarkers={cameraMarkers}
                    gridLines={gridLines}
                    pingKey={pingKey}
                    trailPaths={trailPaths}
                    wedges={wedges}
                    connections={connections}
                    hoveredCameraId={hoveredCameraId ?? undefined}
                    onHoverCamera={handleCameraHover}
                    onSelectCamera={(cameraId) => {
                      setActiveCameraId(cameraId)
                      onSelectEntity(cameraId)
                    }}
                    onSelectPerson={(personId) => {
                      onSelectEntity(personId)
                      setPingPersonId(personId)
                      setPingKey((prev) => prev + 1)
                    }}
                    peopleMarkers={peopleMarkers}
                    pingPoint={pingPoint}
                    selectedPersonId={selectedPersonId}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <div className='flex w-full items-center justify-between text-xs text-muted-foreground'>
                  <span>People: {scene.people.length}</span>
                  <span>Cameras: {scene.cameras.length}</span>
                  <span>Detections: {visionState.detectionsCount}</span>
                  <span>Update: 30 FPS</span>
                </div>
              </CardFooter>
              <div
                className='absolute bottom-2 right-2 size-3 cursor-se-resize'
                onPointerDown={handleResizeStart}
              />
            </>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
