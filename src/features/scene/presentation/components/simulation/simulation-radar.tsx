import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import type {SceneRoot} from '@/features/scene/domain/types'

import {Card, CardContent, CardFooter} from '@/components/ui/card'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

import type {RadarDisplayMode} from './simulation-radar-header'

import {SimulationRealRadar} from './real-radar/simulation-real-radar'
import {
  computeSceneOrigin,
  createCoordinateTransformer,
} from './simulation-helpers'
import {SimulationRadarHeader} from './simulation-radar-header'
import {SimulationRadarSvg} from './simulation-radar-svg'
import {useRadarGeometry} from './use-radar-geometry'
import {useRadarInteractions} from './use-radar-interactions'

interface SimulationRadarProps {
  scene: SceneRoot
  focusAreaId?: string
  size: {width: number; height: number}
  selectedEntityIds: string[]
  onSelectEntity: (id?: string) => void
}

const getFramedSceneForRadar = (
  scene: SceneRoot,
  focusAreaId?: string,
): SceneRoot => {
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
}

// eslint-disable-next-line max-lines-per-function
export const SimulationRadar: React.FC<SimulationRadarProps> = ({
  scene,
  focusAreaId,
  size,
  selectedEntityIds,
  onSelectEntity,
}) => {
  const radarSettings = useUiStore((state) => state.radarSettings)
  const setRadarSettings = useUiStore((state) => state.setRadarSettings)
  const visionState = useUiStore((state) => state.visionState)
  const [radarMode, setRadarMode] =
    React.useState<RadarDisplayMode>('simulated')
  const isSimulatedMode = radarMode === 'simulated'

  const selectedPersonId = React.useMemo(
    () => selectedEntityIds.find((id) => id.startsWith('person-')),
    [selectedEntityIds],
  )

  const sourceScene = React.useMemo(() => scene, [scene])
  const framedScene = React.useMemo(
    () => getFramedSceneForRadar(sourceScene, focusAreaId),
    [focusAreaId, sourceScene],
  )
  const originPoint = React.useMemo(
    () => computeSceneOrigin(framedScene),
    [framedScene],
  )
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
    enabled: isSimulatedMode,
    scene: sourceScene,
    focusAreaId,
    radarSettings,
    size,
    transformer,
    peopleWorld,
    cameraDetections,
  })

  // DON'T REMOVE THE COMMENTED CODE BELOW.
  // Radar people movement trails are intentionally disabled for now.
  // const trailPaths = useRadarTrails({
  //   scene,
  //   focusAreaId,
  //   peopleWorld,
  //   updatedAt: visionState.updatedAt,
  //   toRadar,
  // })
  const trailPaths: {id: string; path: string}[] = []
  const visiblePeopleCount = React.useMemo(
    () => framedScene.people.length,
    [framedScene.people],
  )
  const visibleCameraCount = React.useMemo(
    () => framedScene.cameras.length,
    [framedScene.cameras],
  )
  const visibleDetectionCount = React.useMemo(() => {
    if (radarMode === 'simulated' && !focusAreaId) {
      return visionState.detectionsCount
    }

    const visiblePeopleIds = new Set(
      framedScene.people.map((person) => person.id),
    )
    return framedScene.cameras.reduce((total, camera) => {
      const visible = visionState.visibleByCameraId[camera.id] ?? []
      const count = visible.filter((personId) =>
        visiblePeopleIds.has(personId),
      ).length
      return total + count
    }, 0)
  }, [
    focusAreaId,
    framedScene.cameras,
    framedScene.people,
    radarMode,
    visionState.detectionsCount,
    visionState.visibleByCameraId,
  ])
  const [pingKey, setPingKey] = React.useState(0)
  const [pingPersonId, setPingPersonId] = React.useState<string | null>(null)
  const [hoveredCameraId, setHoveredCameraId] = React.useState<string | null>(
    null,
  )

  React.useEffect(() => {
    setRadarSettings({pan: {x: 0, y: 0}})
  }, [focusAreaId, radarMode, setRadarSettings])

  React.useEffect(() => {
    if (selectedPersonId) {
      setPingPersonId(selectedPersonId)
      setPingKey((prev) => prev + 1)
    }
  }, [selectedPersonId])

  const handleCameraHover = useCallbackRef((cameraId?: string) => {
    setHoveredCameraId(cameraId ?? null)
  })
  const {interactionRef, handlePanStart} = useRadarInteractions({
    enabled: isSimulatedMode,
    radarSettings,
    setRadarSettings,
  })

  const pingPoint = React.useMemo(() => {
    if (!isSimulatedMode) {
      return null
    }

    if (!pingPersonId) {
      return null
    }
    const world = peopleWorld[pingPersonId]
    if (!world) {
      return null
    }
    return toRadar({x: world.x, z: world.z})
  }, [isSimulatedMode, peopleWorld, pingPersonId, toRadar])

  return (
    <div className='vs:pointer-events-auto vs:w-full'>
      <div className='vs:size-full'>
        <Card className='vs:w-full vs:rounded-none vs:border-none'>
          <SimulationRadarHeader mode={radarMode} onModeChange={setRadarMode} />
          <CardContent className='vs:p-0 vs:overflow-hidden'>
            <div
              className='vs:relative vs:overflow-hidden vs:overscroll-contain'
              ref={isSimulatedMode ? interactionRef : undefined}
              onPointerDown={isSimulatedMode ? handlePanStart : undefined}
            >
              {radarMode === 'real' ? (
                <SimulationRealRadar
                  size={size}
                  scene={scene}
                  focusAreaId={focusAreaId}
                  onSelectEntity={onSelectEntity}
                />
              ) : (
                <SimulationRadarSvg
                  size={size}
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
              )}
            </div>
          </CardContent>
          <CardFooter>
            <div className='vs:flex vs:w-full vs:items-center vs:justify-between vs:text-xs vs:text-muted-foreground'>
              <span>People: {visiblePeopleCount}</span>
              <span>Cameras: {visibleCameraCount}</span>
              <span>Detections: {visibleDetectionCount}</span>
              <span>Update: 30 FPS</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
