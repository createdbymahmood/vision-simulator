/* eslint-disable no-alert, max-lines-per-function, max-statements */

import type React from 'react'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {useEffect, useMemo, useState} from 'react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'

import type {
  SceneBackground,
  SceneEntityKind,
  SceneShapeKind,
  SceneTool,
} from '../../core/scene-types'
import type {CanvasPoint} from './types'

import {useSceneHistoryStore} from '../scene-history-store'
import {useSceneStore} from '../scene-store'
import {CanvasBottomToolbar} from './bottom-toolbar'
import {useElementSize} from './hooks'
import {CanvasStage} from './stage-canvas'
import {CanvasTopPanel} from './top-panel'

export const CanvasEditor: React.FC = () => {
  const [boardRef, boardSize] = useElementSize<HTMLDivElement>()
  const [offset, setOffset] = useState<CanvasPoint>({x: 0, y: 0})
  const [scale, setScale] = useState(1)
  const [snapEnabled] = useState(false)
  const [editMode, setEditMode] = useState(true)
  const [shapeTool, setShapeTool] = useState<SceneShapeKind>('rectangle')
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const scene = useSceneStore((state) => state.scene)
  const selection = useSceneStore((state) => state.selection)
  const activeTool = useSceneStore((state) => state.activeTool)
  const setActiveTool = useSceneStore((state) => state.setActiveTool)
  const setSceneMode = useSceneStore((state) => state.setSceneMode)
  const setSceneBackground = useSceneStore((state) => state.setSceneBackground)
  const setActivePopover = useSceneStore((state) => state.setActivePopover)
  const selectEntity = useSceneStore((state) => state.selectEntity)
  const closeOverlays = useSceneStore((state) => state.closeOverlays)
  const addWall = useSceneStore((state) => state.addWall)
  const updateWall = useSceneStore((state) => state.updateWall)
  const addShape = useSceneStore((state) => state.addShape)
  const updateShape = useSceneStore((state) => state.updateShape)
  const updateCamera = useSceneStore((state) => state.updateCamera)
  const updatePerson = useSceneStore((state) => state.updatePerson)
  const addCamera = useSceneStore((state) => state.addCamera)
  const addPerson = useSceneStore((state) => state.addPerson)
  const resetScene = useSceneStore((state) => state.resetScene)
  const hydrateScene = useSceneStore((state) => state.hydrateScene)

  const captureSnapshot = useSceneHistoryStore((state) => state.captureSnapshot)
  const undoSnapshot = useSceneHistoryStore((state) => state.undo)
  const redoSnapshot = useSceneHistoryStore((state) => state.redo)
  const clearHistory = useSceneHistoryStore((state) => state.clearHistory)
  const historyPast = useSceneHistoryStore((state) => state.past)
  const historyFuture = useSceneHistoryStore((state) => state.future)

  useEffect(() => {
    setSceneMode('canvas')
  }, [setSceneMode])

  const activeShapeKindLabel = useMemo(() => {
    if (shapeTool === 'rectangle') return 'Rectangle'
    if (shapeTool === 'circle') return 'Circle'
    if (shapeTool === 'triangle') return 'Triangle'
    return 'Line'
  }, [shapeTool])

  const handleClearBoard = useCallbackRef(() => {
    clearHistory()
    resetScene()
    setClearDialogOpen(false)
  })

  const handleUndo = useCallbackRef(() => {
    const previous = undoSnapshot(scene)
    if (previous) {
      hydrateScene(previous)
    }
  })

  const handleRedo = useCallbackRef(() => {
    const next = redoSnapshot(scene)
    if (next) {
      hydrateScene(next)
    }
  })

  const handleExport = useCallbackRef(() => {
    const blob = new Blob([JSON.stringify(scene, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `scene-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  })

  const handleBackgroundImage = useCallbackRef(() => {
    const url = window.prompt('Enter background image URL')
    if (!url) {
      return
    }
    captureSnapshot(scene)
    setSceneBackground({
      type: 'image',
      value: url,
      opacity: 0.4,
    } as SceneBackground)
  })

  const handleLivePreview = useCallbackRef(() => {
    alert('Live preview not implemented yet')
  })

  const handleSelectEntity = useCallbackRef(
    (payload: {id: string; kind: SceneEntityKind} | null) => {
      selectEntity(payload)
    },
  )

  const handleToolChange = useCallbackRef((tool: SceneTool) => {
    setActiveTool(tool)
    setActivePopover(null)
  })

  const handleShapeSelect = useCallbackRef((kind: SceneShapeKind) => {
    setShapeTool(kind)
    setActiveTool('shape')
  })

  return (
    <div className='relative flex flex-col size-full'>
      <CanvasTopPanel
        activeTool={activeTool}
        canRedo={Boolean(historyFuture.length)}
        canUndo={Boolean(historyPast.length)}
        editMode={editMode}
        onClearBoard={() => setClearDialogOpen(true)}
        onExport={handleExport}
        onLivePreview={handleLivePreview}
        onRedo={handleRedo}
        onToggleEditMode={setEditMode}
        onUndo={handleUndo}
      />
      <div className='relative flex-1 min-h-0 overflow-hidden' ref={boardRef}>
        <CanvasStage
          size={boardSize}
          scale={scale}
          scene={scene}
          snapEnabled={snapEnabled}
          activeTool={activeTool}
          editMode={editMode}
          offset={offset}
          onAddCamera={addCamera}
          onAddPerson={addPerson}
          onAddShape={addShape}
          onAddWall={addWall}
          onCaptureSnapshot={captureSnapshot}
          onCloseOverlays={closeOverlays}
          onOffsetChange={setOffset}
          onScaleChange={setScale}
          onSelectEntity={handleSelectEntity}
          onUpdateCamera={updateCamera}
          onUpdatePerson={updatePerson}
          onUpdateShape={updateShape}
          onUpdateWall={updateWall}
          selection={selection}
          shapeTool={shapeTool}
        />
      </div>
      <CanvasBottomToolbar
        activeShapeLabel={activeShapeKindLabel}
        activeTool={activeTool}
        onBackgroundClick={handleBackgroundImage}
        onShapeSelect={handleShapeSelect}
        onToolChange={handleToolChange}
      />
      <AlertDialog onOpenChange={setClearDialogOpen} open={clearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear board?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all objects, reset history, and clear the canvas
              background.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant='destructive' onClick={handleClearBoard}>
              Clear
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

CanvasEditor.displayName = 'canvas-editor'
