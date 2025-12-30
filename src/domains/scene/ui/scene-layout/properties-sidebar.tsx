import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
/* eslint-disable max-lines-per-function */
import React, {useEffect, useMemo, useRef} from 'react'

import {Separator} from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import type {
  SceneBackground,
  SceneCamera,
  SceneEntity,
  SceneEntityKind,
  ScenePerson,
  SceneShape,
  SceneWall,
} from '../../core/scene-types'

import {useSceneHistoryStore} from '../scene-history-store'
import {useSceneStore} from '../scene-store'
import {
  BackgroundPanel,
  CameraPanel,
  PersonPanel,
  ShapePanel,
  WallPanel,
} from './property-panels'

interface PropertiesSidebarProps {
  open: boolean
  selected: SceneEntity | null
  selectedKind: SceneEntityKind | null
  onClose: () => void
}

export const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  open,
  selected,
  selectedKind,
  onClose,
}) => {
  const updateWall = useSceneStore((state) => state.updateWall)
  const updateShape = useSceneStore((state) => state.updateShape)
  const updateCamera = useSceneStore((state) => state.updateCamera)
  const updatePerson = useSceneStore((state) => state.updatePerson)
  const setBackground = useSceneStore((state) => state.setSceneBackground)
  const scene = useSceneStore((state) => state.scene)
  const captureSnapshot = useSceneHistoryStore((state) => state.captureSnapshot)
  const debounceTimerRef = useRef<number | null>(null)
  const pendingSnapshotRef = useRef(false)

  const handleOpenChange = useCallbackRef((nextOpen: boolean) => {
    if (!nextOpen) {
      onClose()
    }
  })

  const handlePointerDownOutside = useCallbackRef((event: Event) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('[data-canvas-surface]')) {
      event.preventDefault()
    }
  })

  const ensureSnapshot = useCallbackRef(() => {
    if (!pendingSnapshotRef.current) {
      captureSnapshot(scene)
      pendingSnapshotRef.current = true
    }
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = window.setTimeout(() => {
      pendingSnapshotRef.current = false
      debounceTimerRef.current = null
    }, 300)
  })

  useEffect(
    () => () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
      }
    },
    [],
  )

  const handleWallChange = useCallbackRef(
    (wallId: string, patch: Partial<SceneWall>) => {
      ensureSnapshot()
      updateWall(wallId, patch)
    },
  )
  const handleShapeChange = useCallbackRef(
    (shapeId: string, patch: Partial<SceneShape>) => {
      ensureSnapshot()
      updateShape(shapeId, patch)
    },
  )
  const handleCameraChange = useCallbackRef(
    (cameraId: string, patch: Partial<SceneCamera>) => {
      ensureSnapshot()
      updateCamera(cameraId, patch)
    },
  )
  const handlePersonChange = useCallbackRef(
    (personId: string, patch: Partial<ScenePerson>) => {
      ensureSnapshot()
      updatePerson(personId, patch)
    },
  )
  const handleBackgroundChange = useCallbackRef((next: SceneBackground) => {
    ensureSnapshot()
    setBackground(next, {merge: true})
  })

  const handleWallPanelChange = useCallbackRef((patch: Partial<SceneWall>) => {
    if (!selected || selectedKind !== 'wall') {
      return
    }
    handleWallChange(selected.id, patch)
  })

  const handleShapePanelChange = useCallbackRef(
    (patch: Partial<SceneShape>) => {
      if (!selected || selectedKind !== 'shape') {
        return
      }
      handleShapeChange(selected.id, patch)
    },
  )

  const handleCameraPanelChange = useCallbackRef(
    (patch: Partial<SceneCamera>) => {
      if (!selected || selectedKind !== 'camera') {
        return
      }
      handleCameraChange(selected.id, patch)
    },
  )

  const handlePersonPanelChange = useCallbackRef(
    (patch: Partial<ScenePerson>) => {
      if (!selected || selectedKind !== 'person') {
        return
      }
      handlePersonChange(selected.id, patch)
    },
  )

  const handleBackgroundPanelChange = useCallbackRef(
    (next: SceneBackground) => {
      if (!selected || selectedKind !== 'background') {
        return
      }
      handleBackgroundChange(next)
    },
  )

  let panel: React.ReactNode = null
  if (selected && selectedKind === 'wall') {
    panel = (
      <WallPanel
        wall={selected as SceneWall}
        onChange={handleWallPanelChange}
      />
    )
  } else if (selected && selectedKind === 'shape') {
    panel = (
      <ShapePanel
        shape={selected as SceneShape}
        onChange={handleShapePanelChange}
      />
    )
  } else if (selected && selectedKind === 'camera') {
    panel = (
      <CameraPanel
        camera={selected as SceneCamera}
        onChange={handleCameraPanelChange}
      />
    )
  } else if (selected && selectedKind === 'person') {
    panel = (
      <PersonPanel
        onChange={handlePersonPanelChange}
        person={selected as ScenePerson}
      />
    )
  } else if (selected && selectedKind === 'background') {
    panel = (
      <BackgroundPanel
        background={selected as SceneBackground}
        onChange={handleBackgroundPanelChange}
      />
    )
  }

  const title = useMemo(() => {
    if (!selected || !selectedKind) {
      return 'Properties'
    }
    if (selectedKind === 'wall') return `Wall • ${selected.id}`
    if (selectedKind === 'shape') return `Shape • ${selected.id}`
    if (selectedKind === 'camera') return `Camera • ${selected.id}`
    if (selectedKind === 'person') return `Person • ${selected.id}`
    if (selectedKind === 'background') return 'Background'
    return 'Properties'
  }, [selected, selectedKind])

  return (
    <Sheet modal={false} onOpenChange={handleOpenChange} open={open}>
      <SheetContent
        className='w-[420px]'
        side='right'
        onPointerDownOutside={handlePointerDownOutside}
      >
        <SheetHeader className='pb-0'>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Live properties update the scene instantly.
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className='px-4'>
          {panel ?? (
            <p className='text-muted-foreground text-sm'>
              Nothing selected. Click an entity to edit its properties.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

PropertiesSidebar.displayName = 'properties-sidebar'
