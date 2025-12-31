/* eslint-disable max-lines-per-function, max-statements */

import type Konva from 'konva'
import type React from 'react'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {useEffect, useMemo, useRef, useState} from 'react'

import type {
  SceneBackground,
  SceneEntityKind,
  SceneShapeKind,
  SceneTool,
} from '../../core/scene-types'
import type {CanvasPoint} from './types'

import {useSceneHistoryStore} from '../scene-history-store'
import {useSceneStore} from '../scene-store'
import {SimulationView} from '../simulation'
import {CanvasBottomToolbar} from './bottom-toolbar'
import {ClearBoardDialog} from './clear-board-dialog'
import {useElementSize, useUndoRedoShortcuts} from './hooks'
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
  const [showSimulation, setShowSimulation] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)

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
  const updateArea = useSceneStore((state) => state.updateArea)
  const addCamera = useSceneStore((state) => state.addCamera)
  const addPerson = useSceneStore((state) => state.addPerson)
  const selectEntities = useSceneStore((state) => state.selectEntities)
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

  const handleExportScene = useCallbackRef(() => {
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

  const handleExportImage = useCallbackRef(() => {
    const stage = stageRef.current
    if (!stage) {
      return
    }
    const gridLayer = stage.findOne('#canvas-grid')
    const wasVisible = gridLayer ? gridLayer.visible() : null
    if (gridLayer) {
      gridLayer.visible(false)
    }
    const dataUrl = stage.toDataURL({pixelRatio: 2, mimeType: 'image/png'})
    if (gridLayer && wasVisible !== null) {
      gridLayer.visible(wasVisible)
    }
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `scene-${Date.now()}.png`
    link.click()
  })

  const handleSelectEntity = useCallbackRef(
    (payload: {id: string; kind: SceneEntityKind} | null) => {
      selectEntity(payload)
    },
  )

  const handleBackgroundImage = useCallbackRef(() => {
    fileInputRef.current?.click()
  })

  const handleBackgroundFileChange = useCallbackRef(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) {
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const value = typeof reader.result === 'string' ? reader.result : ''
        if (!value) {
          return
        }
        captureSnapshot(scene)
        const position = scene.background?.position ?? {x: 0, y: 0}
        setSceneBackground(
          {
            type: 'image',
            value,
            opacity: scene.background?.opacity ?? 0.4,
            scale: scene.background?.scale ?? 1,
            rotation: scene.background?.rotation ?? 0,
            position,
            locked: scene.background?.locked ?? false,
          } as SceneBackground,
          {merge: false},
        )
        handleSelectEntity({id: 'background', kind: 'background'})
      }
      reader.readAsDataURL(file)
      event.target.value = ''
    },
  )

  const handleLivePreview = useCallbackRef(() => {
    setShowSimulation(true)
  })

  const handleToolChange = useCallbackRef((tool: SceneTool) => {
    setActiveTool(tool)
    setActivePopover(null)
  })

  const handleShapeSelect = useCallbackRef((kind: SceneShapeKind) => {
    setShapeTool(kind)
    setActiveTool('shape')
  })

  const handleOpenClearDialog = useCallbackRef(() => {
    setClearDialogOpen(true)
  })

  const handleClearDialogChange = useCallbackRef((open: boolean) => {
    setClearDialogOpen(open)
  })

  useUndoRedoShortcuts(handleUndo, handleRedo)

  const handleCloseSimulation = useCallbackRef(() => {
    setShowSimulation(false)
  })

  return (
    <div className='relative flex flex-col size-full'>
      {showSimulation ? (
        <SimulationView scene={scene} onClose={handleCloseSimulation} />
      ) : (
        <>
          <CanvasTopPanel
            activeTool={activeTool}
            canRedo={Boolean(historyFuture.length)}
            canUndo={Boolean(historyPast.length)}
            editMode={editMode}
            onClearBoard={handleOpenClearDialog}
            onExportImage={handleExportImage}
            onExportScene={handleExportScene}
            onLivePreview={handleLivePreview}
            onRedo={handleRedo}
            onToggleEditMode={setEditMode}
            onUndo={handleUndo}
          />
          <div
            className='relative flex-1 min-h-0 overflow-hidden'
            ref={boardRef}
          >
            <CanvasStage
              size={boardSize}
              scale={scale}
              scene={scene}
              snapEnabled={snapEnabled}
              stageRef={stageRef}
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
              onSelectEntities={selectEntities}
              onUpdateCamera={updateCamera}
              onUpdateArea={updateArea}
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
          <input
            accept='image/*'
            className='hidden'
            ref={fileInputRef}
            type='file'
            onChange={handleBackgroundFileChange}
          />
          <ClearBoardDialog
            onConfirm={handleClearBoard}
            onOpenChange={handleClearDialogChange}
            open={clearDialogOpen}
          />
        </>
      )}
    </div>
  )
}

CanvasEditor.displayName = 'canvas-editor'
