import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React, {useEffect, useMemo, useRef, useState} from 'react'

import {Card, CardContent} from '@/components/ui/card'
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group'

import type {Scene} from '../../core/scene-types'
import type {CanvasPoint} from '../canvas-editor/types'
import type {CameraVision, SimulationViewportHandle} from './types'

import {normalizePeople} from '../../simulation/core/camera-vision'
import {computeVisionPolygon as computeCanvasVisionPolygon} from '../canvas-editor/vision'
import {CameraTiles} from './camera-tiles'
import {buildObstacles, usePeopleMovement} from './people-movement'
import {Simulation2DView} from './simulation-2d-view'
import {SimulationMiniMap} from './simulation-mini-map'
import {SimulationTopBar} from './simulation-top-bar'
import {SimulationWorld} from './simulation-world'
import {useViewportRecorder} from './use-viewport-recorder'

const toRadians = (deg: number) => (deg * Math.PI) / 180
const computePolygonArea = (polygon: CanvasPoint[]): number =>
  Math.abs(
    polygon.reduce((sum, point, index) => {
      const next = polygon[(index + 1) % polygon.length]
      return sum + point.x * next.y - next.x * point.y
    }, 0) / 2,
  )

const buildCameraVisions = (
  scene: Scene,
  normalizedPeople: ReturnType<typeof normalizePeople>,
): CameraVision[] =>
  scene.cameras.map((camera) => {
    if (camera.depth <= 0) {
      return {
        id: camera.id,
        height: camera.height,
        points: [{x: camera.x, y: camera.y}],
        sampleCount: 0,
        visiblePeople: [],
      }
    }

    const polygon = computeCanvasVisionPolygon(camera, scene)
    const area = computePolygonArea(polygon)
    if (polygon.length < 3 || area < 0.0001) {
      return {
        id: camera.id,
        height: camera.height,
        points: [{x: camera.x, y: camera.y}],
        sampleCount: polygon.length,
        visiblePeople: [],
      }
    }

    const direction = toRadians(camera.direction)
    const halfFov = toRadians(Math.min(camera.fov, 179.9)) / 2
    const near = Math.max(camera.nearPlane ?? 0, 0)
    const maxDistance = camera.depth

    const visiblePeople = normalizedPeople.map((person) => {
      const dx = person.x - camera.x
      const dy = person.y - camera.y
      const distance = Math.hypot(dx, dy)
      const angleToPerson = Math.atan2(dy, dx)
      const delta = Math.atan2(
        Math.sin(angleToPerson - direction),
        Math.cos(angleToPerson - direction),
      )
      const rangeAllowance = person.radius
      const inRange =
        distance - rangeAllowance <= maxDistance &&
        distance + rangeAllowance >= near
      const angleAllowance = Math.asin(
        Math.min(person.radius / Math.max(distance, person.radius), 1),
      )
      const inFov = Math.abs(delta) <= halfFov + angleAllowance + 0.0001
      const visible = inRange && inFov
      return {
        id: person.id,
        center: {x: person.x, y: person.y},
        height: person.height,
        radius: person.radius,
        distance,
        occludedBy: null,
        inRange,
        inFov,
        visible,
      }
    })

    return {
      id: camera.id,
      height: camera.height,
      points: polygon,
      sampleCount: polygon.length,
      visiblePeople,
    }
  })

type SimulationMode = '2d' | '3d'

interface SimulationViewProps {
  scene: Scene
  onClose: () => void
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  scene,
  onClose,
}) => {
  const [mode, setMode] = useState<SimulationMode>('3d')
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const viewportHandleRef = useRef<SimulationViewportHandle | null>(null)
  const obstacles = buildObstacles(scene.shapes, scene.walls)
  const movingPeople = usePeopleMovement(scene.people, obstacles)
  const normalizedPeople = useMemo(
    () => normalizePeople(movingPeople),
    [movingPeople],
  )
  const cameraVisions = useMemo<CameraVision[]>(
    () => buildCameraVisions(scene, normalizedPeople),
    [normalizedPeople, scene],
  )
  const {recording, replaceSource, startRecording, stopRecording} =
    useViewportRecorder()

  const handleExportSnapshot = useCallbackRef(async (scale: number) => {
    const handle = viewportHandleRef.current
    if (!handle) return
    const snapshot = await handle.getSnapshot(scale)
    if (!snapshot) return
    const link = document.createElement('a')
    link.href = snapshot
    link.download = `simulation-${Date.now()}@${Math.max(
      1,
      Math.round(scale),
    )}x.png`
    link.click()
  })

  const handleToggleRecording = useCallbackRef(async (next: boolean) => {
    if (next) {
      await startRecording(viewportHandleRef.current)
      return
    }
    stopRecording()
  })

  const handleModeChange = useCallbackRef((value: string) => {
    setMode((value as SimulationMode) || '3d')
  })

  const handleSelectPerson = useCallbackRef((id: string) => {
    setSelectedPersonId(id)
  })

  const handleViewportReady = useCallbackRef(
    (handle: SimulationViewportHandle) => {
      viewportHandleRef.current = handle
      if (recording) {
        replaceSource(handle)
      }
    },
  )

  useEffect(
    () => () => {
      stopRecording()
    },
    [stopRecording],
  )

  return (
    <div className='flex h-full flex-col bg-background'>
      <SimulationTopBar
        onClose={onClose}
        onExportSnapshot={handleExportSnapshot}
        onToggleRecording={handleToggleRecording}
        recording={recording}
      />
      <div className='flex items-center gap-3 px-6 py-2'>
        <div className='text-lg font-semibold'>Simulation Analysis</div>
        <div className='text-muted-foreground text-sm'>
          • Click a person to select and show trail
        </div>
        <ToggleGroup
          className='ml-auto'
          type='single'
          value={mode}
          onValueChange={handleModeChange}
        >
          <ToggleGroupItem value='3d'>3D</ToggleGroupItem>
          <ToggleGroupItem value='2d'>2D</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className='flex flex-1 gap-4 overflow-hidden'>
        <Card className='flex-1 overflow-hidden shadow-none rounded-none p-0 '>
          <CardContent className='p-0 h-full size-full overflow-hidden flex'>
            {mode === '3d' ? (
              <div className='flex-1'>
                <SimulationWorld
                  scene={scene}
                  cameraVisions={cameraVisions}
                  onSelectPerson={handleSelectPerson}
                  onViewportReady={handleViewportReady}
                  people={movingPeople}
                  selectedPersonId={selectedPersonId}
                />
              </div>
            ) : (
              <div className='flex-1'>
                <Simulation2DView
                  cameras={scene.cameras}
                  shapes={scene.shapes}
                  walls={scene.walls}
                  cameraVisions={cameraVisions}
                  onSelectPerson={handleSelectPerson}
                  onViewportReady={handleViewportReady}
                  people={movingPeople}
                  selectedPersonId={selectedPersonId}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className='w-[320px] space-y-3 h-full overflow-auto pb-2 pr-4'>
          <SimulationMiniMap
            cameras={scene.cameras}
            shapes={scene.shapes}
            walls={scene.walls}
            cameraVisions={cameraVisions}
            people={movingPeople}
          />

          <CameraTiles
            cameras={scene.cameras}
            shapes={scene.shapes}
            walls={scene.walls}
            cameraVisions={cameraVisions}
            onSelectPerson={handleSelectPerson}
            people={movingPeople}
            selectedPersonId={selectedPersonId}
          />
        </div>
      </div>
    </div>
  )
}

SimulationView.displayName = 'simulation-view'
