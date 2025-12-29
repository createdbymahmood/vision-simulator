import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React, {useEffect, useMemo} from 'react'

import type {SceneEntity, SceneEntityKind} from '../../core/scene-types'

import {CanvasEditor} from '../canvas-editor'
import {useSceneStore} from '../scene-store'
import {MapPlaceholder} from './map-placeholder'
import {PropertiesSidebar} from './properties-sidebar'
import {SceneCommandPalette} from './scene-command-palette'

export const SceneLayout: React.FC = () => {
  const scene = useSceneStore((state) => state.scene)
  const selection = useSceneStore((state) => state.selection)
  const overlays = useSceneStore((state) => state.overlays)
  const setActiveTool = useSceneStore((state) => state.setActiveTool)
  const setSceneMode = useSceneStore((state) => state.setSceneMode)
  const setCommandPaletteOpen = useSceneStore(
    (state) => state.setCommandPaletteOpen,
  )
  const selectEntity = useSceneStore((state) => state.selectEntity)
  const closeOverlays = useSceneStore((state) => state.closeOverlays)
  const resetScene = useSceneStore((state) => state.resetScene)

  const selectedEntity = useMemo<SceneEntity | null>(() => {
    if (!selection.selectedEntityId || !selection.selectedEntityKind) {
      return null
    }

    const collections: Record<SceneEntityKind, SceneEntity[]> = {
      wall: scene.walls,
      shape: scene.shapes,
      camera: scene.cameras,
      person: scene.people,
      area: scene.areas,
    }

    return (
      collections[selection.selectedEntityKind].find(
        (entity) => entity.id === selection.selectedEntityId,
      ) ?? null
    )
  }, [scene, selection.selectedEntityId, selection.selectedEntityKind])

  const onCommandToggle = useCallbackRef((next: boolean) => {
    setCommandPaletteOpen(next)
    if (!next) {
      closeOverlays()
    }
  })
  const handleCloseProperties = useCallbackRef(() => {
    closeOverlays()
    selectEntity(null)
  })

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeOverlays()
        selectEntity(null)
      }
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [closeOverlays, selectEntity])

  return (
    <div className='relative h-screen w-full bg-background text-foreground flex'>
      <main className='flex size-full flex-col'>
        {scene.mode === 'canvas' ? <CanvasEditor /> : <MapPlaceholder />}
      </main>

      <PropertiesSidebar
        selected={selectedEntity}
        onClose={handleCloseProperties}
        open={overlays.isPropertiesOpen && Boolean(selectedEntity)}
      />
      <SceneCommandPalette
        onOpenChange={onCommandToggle}
        onResetScene={resetScene}
        onSelectMode={setSceneMode}
        onSelectTool={setActiveTool}
        open={overlays.isCommandPaletteOpen}
      />
    </div>
  )
}

SceneLayout.displayName = 'scene-layout'
