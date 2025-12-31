import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
/* eslint-disable max-lines-per-function */
import {Trash2Icon} from 'lucide-react'
import React, {useEffect, useMemo, useRef} from 'react'

import {Button} from '@/components/ui/button'
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
  const removeWall = useSceneStore((state) => state.removeWall)
  const removeShape = useSceneStore((state) => state.removeShape)
  const removeCamera = useSceneStore((state) => state.removeCamera)
  const removePerson = useSceneStore((state) => state.removePerson)
  const selectEntity = useSceneStore((state) => state.selectEntity)
  const scene = useSceneStore((state) => state.scene)
  const captureSnapshot = useSceneHistoryStore((state) => state.captureSnapshot)
  const debounceTimerRef = useRef<number | null>(null)
  const pendingSnapshotRef = useRef(false)

  const handleOpenChange = useCallbackRef((nextOpen: boolean) => {
    if (!nextOpen) {
      onClose()
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

  useEffect(() => {
    if (!open) {
      return
    }
    const overlays = Array.from(
      document.querySelectorAll<HTMLElement>('[data-slot="sheet-overlay"]'),
    )
    overlays.forEach((overlay) => {
      overlay.dataset.allowPointer = 'true'
      overlay.style.pointerEvents = 'none'
    })
    return () => {
      overlays.forEach((overlay) => {
        if (overlay.dataset.allowPointer) {
          overlay.style.removeProperty('pointer-events')
          delete overlay.dataset.allowPointer
        }
      })
    }
  }, [open])

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
  const handleDeleteSelected = useCallbackRef(() => {
    if (!selected || !selectedKind) {
      return
    }
    ensureSnapshot()
    if (selectedKind === 'wall') {
      removeWall(selected.id)
    } else if (selectedKind === 'shape') {
      removeShape(selected.id)
    } else if (selectedKind === 'camera') {
      removeCamera(selected.id)
    } else if (selectedKind === 'person') {
      removePerson(selected.id)
    } else {
      return
    }
    selectEntity(null)
    onClose()
  })

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

  const canDelete =
    Boolean(selected) &&
    (selectedKind === 'wall' ||
      selectedKind === 'shape' ||
      selectedKind === 'camera' ||
      selectedKind === 'person')

  return (
    <Sheet modal={false} onOpenChange={handleOpenChange} open={open}>
      <SheetContent className='w-[420px]' side='right'>
        <SheetHeader className='pb-0'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>
                Live properties update the scene instantly.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        <div className='px-4 flex flex-col gap-2 items-start'>
          {panel ?? (
            <p className='text-muted-foreground text-sm'>
              Nothing selected. Click an entity to edit its properties.
            </p>
          )}

          <Button
            size='sm'
            disabled={!canDelete}
            variant='destructive'
            onClick={handleDeleteSelected}
          >
            <Trash2Icon className='mr-2 h-4 w-4' />
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

PropertiesSidebar.displayName = 'properties-sidebar'
