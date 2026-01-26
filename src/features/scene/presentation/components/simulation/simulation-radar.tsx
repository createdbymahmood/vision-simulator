import React from 'react'
import {useCallbackRef} from '@radix-ui/react-use-callback-ref'

import type {SceneRoot} from '@/features/scene/domain/types'

import {ContextMenu, ContextMenuTrigger} from '@/components/ui/context-menu'
import {Card, CardContent, CardFooter} from '@/components/ui/card'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

import {
  computeSceneOrigin,
  createCoordinateTransformer,
} from './simulation-helpers'
import {SimulationRadarSvg} from './simulation-radar-svg'
import {SimulationRadarHeader} from './simulation-radar-header'
import {SimulationRadarMenu} from './simulation-radar-menu'
import {useRadarGeometry} from './use-radar-geometry'
import {useRadarInteractions} from './use-radar-interactions'
import {useRadarTrails} from './use-radar-trails'

interface SimulationRadarProps {
  scene: SceneRoot
  selectedEntityIds: string[]
  onSelectEntity: (id?: string) => void
  containerRef?: React.RefObject<HTMLDivElement>
}

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
    enabled: radarSettings.showTrails,
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

  const handleResetZoom = useCallbackRef(() => {
    setRadarSettings({zoom: 1, pan: {x: 0, y: 0}})
  })

  const handleCameraHover = useCallbackRef((cameraId?: string) => {
    setHoveredCameraId(cameraId ?? null)
  })
  const {
    handleDragStart,
    handlePanStart,
    handleResizeStart,
    handleWheel,
    panelRef,
    panelStyle,
  } = useRadarInteractions({
    radarSettings,
    setRadarSettings,
    containerRef,
  })

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
    <div
      ref={panelRef}
      className='pointer-events-auto absolute'
      style={panelStyle}
    >
      <div
        className={`${radarSettings.isMinimized ? 'w-full' : 'h-full w-full'} rounded-xl border-2 border-white/30 bg-background/70 backdrop-blur`}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Card>
            <SimulationRadarHeader
              isMinimized={radarSettings.isMinimized}
              onDragStart={handleDragStart}
              onToggleMinimize={handleToggleMinimize}
            />
            {!radarSettings.isMinimized ? (
              <>
                <CardContent>
                  <div
                    className='relative'
                    onWheel={handleWheel}
                    onPointerDown={handlePanStart}
                  >
                    <SimulationRadarSvg
                      size={radarSettings.size}
                      gridLines={gridLines}
                      areaPaths={areaPaths}
                      wedges={wedges}
                      trailPaths={trailPaths}
                      connections={connections}
                      cameraMarkers={cameraMarkers}
                      peopleMarkers={peopleMarkers}
                      activeCameraId={activeCameraId}
                      hoveredCameraId={hoveredCameraId ?? undefined}
                      selectedPersonId={selectedPersonId}
                      pingPoint={pingPoint}
                      pingKey={pingKey}
                      onSelectCamera={(cameraId) => {
                        setActiveCameraId(cameraId)
                        onSelectEntity(cameraId)
                      }}
                      onSelectPerson={(personId) => {
                        onSelectEntity(personId)
                        setPingPersonId(personId)
                        setPingKey((prev) => prev + 1)
                      }}
                      onHoverCamera={handleCameraHover}
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
          </ContextMenuTrigger>
          <SimulationRadarMenu
            radarSettings={radarSettings}
            onResetZoom={handleResetZoom}
            onUpdateSettings={setRadarSettings}
          />
        </ContextMenu>
      </div>
    </div>
  )
}
