import React, {useMemo, useRef, useState} from 'react'

import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group'

import type {
  Scene,
  SceneCamera,
  ScenePerson,
  SceneShape,
  SceneWall,
} from '../../core/scene-types'

import {CameraTiles} from './camera-tiles'
import {Simulation2DView} from './simulation-2d-view'
import {SimulationMiniMap} from './simulation-mini-map'
import {SimulationTopBar} from './simulation-top-bar'
import {SimulationWorld} from './simulation-world'

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
  const snapshotRef = useRef<(() => string) | null>(null)

  const handleExportSnapshot = () => {
    const snapshot = snapshotRef.current?.()
    if (!snapshot) {
      return
    }
    const link = document.createElement('a')
    link.href = snapshot
    link.download = `simulation-${Date.now()}.png`
    link.click()
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

  const handleSnapshotReady = (fn: () => string) => {
    snapshotRef.current = fn
  }

  const boundsLabel = useMemo(() => {
    const walls: SceneWall[] = scene.walls
    const shapes: SceneShape[] = scene.shapes
    const people: ScenePerson[] = scene.people
    const cameras: SceneCamera[] = scene.cameras
    const xs = [
      ...walls.flatMap((w) => [w.coordinates.x1, w.coordinates.x2]),
      ...shapes.flatMap((s) => [s.x, s.x + s.width]),
      ...people.map((p) => p.x),
      ...cameras.map((c) => c.x),
    ]
    const ys = [
      ...walls.flatMap((w) => [w.coordinates.y1, w.coordinates.y2]),
      ...shapes.flatMap((s) => [s.y, s.y + s.length]),
      ...people.map((p) => p.y),
      ...cameras.map((c) => c.y),
    ]
    const minX = Math.min(...xs, 0)
    const maxX = Math.max(...xs, 0)
    const minY = Math.min(...ys, 0)
    const maxY = Math.max(...ys, 0)
    return `Bounds: ${minX.toFixed(1)}, ${minY.toFixed(
      1,
    )} — ${maxX.toFixed(1)}, ${maxY.toFixed(1)}`
  }, [scene.cameras, scene.people, scene.shapes, scene.walls])

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
                  onReadySnapshot={handleSnapshotReady}
                  onSelectPerson={handleSelectPerson}
                  selectedPersonId={selectedPersonId}
                />
              </div>
            ) : (
              <div className='flex-1'>
                <Simulation2DView
                  cameras={scene.cameras}
                  shapes={scene.shapes}
                  walls={scene.walls}
                  people={scene.people}
                />
              </div>
            )}
          </CardContent>
        </Card>
        <div className='w-[360px] space-y-3'>
          <SimulationMiniMap
            cameras={scene.cameras}
            shapes={scene.shapes}
            walls={scene.walls}
            people={scene.people}
          />
          <CameraTiles cameras={scene.cameras} />
          <div className='text-xs text-muted-foreground'>{boundsLabel}</div>
          <Button
            size='sm'
            className='w-full'
            variant='outline'
            onClick={onClose}
          >
            Back to Editor
          </Button>
        </div>
      </div>
    </div>
  )
}

SimulationView.displayName = 'simulation-view'
