import React, {useMemo, useRef, useState} from 'react'

import {Card, CardContent} from '@/components/ui/card'
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group'

import type {Scene} from '../../core/scene-types'

import {CameraTiles} from './camera-tiles'
import {buildObstacles, usePeopleMovement} from './people-movement'
import {Simulation2DView} from './simulation-2d-view'
import {SimulationMiniMap} from './simulation-mini-map'
import {SimulationTopBar} from './simulation-top-bar'
import {SimulationWorld} from './simulation-world'
import {computeVisionPolygon} from '../canvas-editor/vision'
import type {CameraVision} from './types'

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
  const [recording, setRecording] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const snapshotRef = useRef<(() => Promise<string>) | null>(null)
  const obstacles = buildObstacles(scene.shapes, scene.walls)
  const movingPeople = usePeopleMovement(scene.people, obstacles)
  const cameraVisions = useMemo<CameraVision[]>(
    () =>
      scene.cameras.map((camera) => ({
        id: camera.id,
        height: camera.height,
        points: computeVisionPolygon(camera, scene),
      })),
    [scene.cameras, scene.shapes, scene.walls, scene.people, scene.meta],
  )

  const handleExportSnapshot = async () => {
    const snapshotFn = snapshotRef.current
    if (!snapshotFn) {
      return
    }
    const snapshot = await snapshotFn()
    if (!snapshot) {
      return
    }
    const link = document.createElement('a')
    link.href = snapshot
    link.download = `simulation-${Date.now()}.png`
    link.click()
    if (snapshot.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(snapshot), 5000)
    }
  }

  const handleToggleRecording = (next: boolean) => {
    setRecording(next)
  }

  const handleModeChange = (value: string) => {
    setMode((value as SimulationMode) || '3d')
  }

  const handleSelectPerson = (id: string) => {
    setSelectedPersonId(id)
  }

  const handleSnapshotReady = (fn: () => Promise<string>) => {
    snapshotRef.current = fn
  }

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
                  cameraVisions={cameraVisions}
                  people={movingPeople}
                  scene={scene}
                  onReadySnapshot={handleSnapshotReady}
                  onSelectPerson={handleSelectPerson}
                  selectedPersonId={selectedPersonId}
                />
              </div>
            ) : (
              <div className='flex-1'>
                <Simulation2DView
                  cameras={scene.cameras}
                  cameraVisions={cameraVisions}
                  onReadySnapshot={handleSnapshotReady}
                  people={movingPeople}
                  shapes={scene.shapes}
                  walls={scene.walls}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className='w-[320px] space-y-3 h-full overflow-auto pb-2 pr-4'>
          <SimulationMiniMap
            cameras={scene.cameras}
            cameraVisions={cameraVisions}
            people={movingPeople}
            shapes={scene.shapes}
            walls={scene.walls}
          />

          <CameraTiles cameras={scene.cameras} />
        </div>
      </div>
    </div>
  )
}

SimulationView.displayName = 'simulation-view'
