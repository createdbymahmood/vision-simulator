import type {MapRef} from 'react-map-gl/mapbox'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'
import {toast} from 'sonner'

import type {UnsavedChangesOptions} from '@/features/scene/presentation/leave-guard/types'
import type {VisionSimulatorMode} from '@/features/scene/presentation/modes/vision-simulator-mode'
import type {EditorUiOverrides} from '@/features/scene/presentation/types/editor-ui-overrides'

import {serializeScene} from '@/features/scene/application/utils/scene-serializer'
import {useHistoryStore} from '@/features/scene/infrastructure/stores/history.store'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {TopPanel} from '@/features/scene/presentation/components/top-panel'
import {useEditorUnsavedChangesGuard} from '@/features/scene/presentation/hooks/use-editor-unsaved-changes-guard'
import {getVisionSimulatorModePolicy} from '@/features/scene/presentation/modes/vision-simulator-mode'
import {
  createSceneImageFilename,
  createSceneJsonFilename,
  downloadBlob,
  downloadDataUrl,
} from '@/features/scene/presentation/utils/scene-export'
import {cn} from '@/lib/utils'

import type {
  CameraPlacementProfile,
  EditorMode,
  SceneMapStyle,
  SceneRoot,
  ViewMode,
} from '../../domain/types'
import type {ShapeDrawMode} from '../types'

import {assignCameraColor} from '../../domain/services/color-assignment'
import {createInitialScene} from '../../domain/services/scene-factory'
import {useEditorShortcuts} from '../hooks/use-editor-shortcuts'
import {useHistoryRecorder} from '../hooks/use-history-recorder'
import {BottomNavigation} from './bottom-navigation'
import {
  AreaManagementDialog,
  DevicesDialog,
  MapStyleDialog,
  PlaceDeviceDialog,
  SearchLocationDialog,
} from './editor-dialogs'
import {AreaPropertiesSheet} from './properties-sheet/area-properties-sheet'
import {CameraPropertiesSheet} from './properties-sheet/camera-properties-sheet'
import {PersonPropertiesSheet} from './properties-sheet/person-properties-sheet'
import {ShapePropertiesSheet} from './properties-sheet/shape-properties-sheet'
import {WallPropertiesSheet} from './properties-sheet/wall-properties-sheet'
import {RightRail} from './right-rail'
import {SimulationAnalysisView} from './simulation/simulation-analysis-view'
import {loadSimulationCanvasModule} from './simulation/simulation-canvas-loader'
import {UnsavedChangesLeaveDialog} from './unsaved-changes-leave-dialog'
import {ViewportShell} from './viewport-shell'

export interface EditorLayoutProps {
  visionSimulatorId: string
  mode: VisionSimulatorMode
  unsavedChanges?: UnsavedChangesOptions
  uiOverrides?: EditorUiOverrides
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const EditorLayout: React.FC<EditorLayoutProps> = ({
  visionSimulatorId,
  mode,
  unsavedChanges,
  uiOverrides,
}) => {
  const [shapeMode, setShapeMode] = React.useState<ShapeDrawMode>('rectangle')
  const [placeDeviceOpen, setPlaceDeviceOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [areaPanelOpen, setAreaPanelOpen] = React.useState(false)
  const [devicesPanelOpen, setDevicesPanelOpen] = React.useState(false)
  const [mapStyleOpen, setMapStyleOpen] = React.useState(false)
  const [mapRef, setMapRef] = React.useState<MapRef | null>(null)
  const hasSeededHistoryRef = React.useRef(false)
  const previousModeRef = React.useRef(mode)
  const modePolicy = React.useMemo(
    () => getVisionSimulatorModePolicy(mode),
    [mode],
  )

  const editorMode = useSceneStore((state) => state.scene.editorMode)
  const mapVisible = useSceneStore((state) => state.scene.mapVisible)
  const mapStyle = useSceneStore((state) => state.scene.meta.mapStyle)
  const areas = useSceneStore((state) => state.scene.areas)
  const cameras = useSceneStore((state) => state.scene.cameras)
  const projectName = useSceneStore((state) => state.projectName)
  const scene = useSceneStore((state) => state.scene)
  const setScene = useSceneStore((state) => state.setScene)
  const setEditorMode = useSceneStore((state) => state.setMode)
  const setMapVisibility = useSceneStore((state) => state.setMapVisibility)
  const setMapStyle = useSceneStore((state) => state.setMapStyle)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const setSelection = useSceneStore((state) => state.setSelection)
  const clearSelection = useSceneStore((state) => state.clearSelection)

  const activeTool = useUiStore((state) => state.activeTool)
  const setActiveTool = useUiStore((state) => state.setActiveTool)
  const isEditMode = useUiStore((state) => state.isEditMode)
  const setEditMode = useUiStore((state) => state.setEditMode)
  const viewMode = useUiStore((state) => state.viewMode)
  const setViewMode = useUiStore((state) => state.setViewMode)
  const setPreviewViewMode = useUiStore((state) => state.setPreviewViewMode)
  const setCameraPlacement = useUiStore((state) => state.setCameraPlacement)
  const closeAllPanels = useUiStore((state) => state.closeAllPanels)
  const closeAllPopovers = useUiStore((state) => state.closeAllPopovers)

  const pastEntries = useHistoryStore((state) => state.past)
  const futureEntries = useHistoryStore((state) => state.future)
  const undoScene = useHistoryStore((state) => state.undo)
  const redoScene = useHistoryStore((state) => state.redo)
  const seedHistory = useHistoryStore((state) => state.seed)
  const setHistoryApplying = useHistoryStore((state) => state.setApplying)

  const {recordAction} = useHistoryRecorder()

  const lastUndoDescription = pastEntries.at(-1)?.description
  const lastRedoDescription = futureEntries.at(-1)?.description
  const canUndo = pastEntries.length > 1
  const canRedo = futureEntries.length > 0
  const hasAreas = areas.length > 0
  const deviceCount = cameras.length
  const nextCameraColor = React.useMemo(
    () => assignCameraColor(cameras.length),
    [cameras.length],
  )

  const {
    leaveDialogConfig,
    leaveDialogState,
    onConfirmDiscardAndLeave,
    onConfirmSaveAndLeave,
    onConfirmStay,
    saveLoading,
    saveScene,
  } = useEditorUnsavedChangesGuard({
    scene,
    unsavedChanges,
    visionSimulatorId,
  })

  const syncSelectionForScene = useCallbackRef((nextScene: SceneRoot) => {
    if (selectedEntityIds.length === 0) {
      return
    }

    const ids = new Set<string>()
    nextScene.areas.forEach((area) => ids.add(area.id))
    nextScene.walls.forEach((wall) => ids.add(wall.id))
    nextScene.shapes.forEach((shape) => ids.add(shape.id))
    nextScene.cameras.forEach((camera) => ids.add(camera.id))
    nextScene.people.forEach((person) => ids.add(person.id))

    const nextSelection = selectedEntityIds.filter((id) => ids.has(id))
    if (nextSelection.length === selectedEntityIds.length) {
      return
    }

    setSelection([])
  })

  const closeTransientUi = useCallbackRef(() => {
    setPlaceDeviceOpen(false)
    setSearchOpen(false)
    setAreaPanelOpen(false)
    setDevicesPanelOpen(false)
    setMapStyleOpen(false)
    closeAllPanels()
    closeAllPopovers()
  })

  const setViewModeIfAllowed = useCallbackRef((nextViewMode: ViewMode) => {
    if (
      modePolicy.lockViewMode &&
      nextViewMode !== modePolicy.initialViewMode
    ) {
      return
    }

    setViewMode(nextViewMode)
  })

  const handleMapReady = useCallbackRef((nextMap: MapRef | null) => {
    setMapRef(nextMap)
  })

  const handleEditorModeChange = (nextMode: EditorMode) => {
    setEditorMode(nextMode)
    const nextScene = setMapVisibility(nextMode === 'map')
    recordAction(
      {type: 'map-visibility', visible: nextMode === 'map'},
      nextScene,
    )
  }

  const handleSave = useCallbackRef(async () => {
    await saveScene()
  })

  const handleBack = useCallbackRef(() => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  })

  const handleBackToEditor = useCallbackRef(() => {
    setViewModeIfAllowed('editor')
  })

  const handleUndo = () => {
    const entry = undoScene(scene)
    if (entry) {
      setHistoryApplying(true)
      setScene(entry.scene)
      syncSelectionForScene(entry.scene)
      setHistoryApplying(false)
    }
  }

  const handleRedo = () => {
    const entry = redoScene(scene)
    if (entry) {
      setHistoryApplying(true)
      setScene(entry.scene)
      syncSelectionForScene(entry.scene)
      setHistoryApplying(false)
    }
  }

  const handleClearBoard = () => {
    const nextScene = createInitialScene()
    setScene(nextScene)
    clearSelection()
    setActiveTool('select')
    seedHistory(nextScene)
  }

  const handleSelectDeviceProfile = (profile: CameraPlacementProfile) => {
    setActiveTool('place-camera')
    setCameraPlacement(profile, nextCameraColor)
    setPlaceDeviceOpen(false)
  }

  const handleBlankClick = () => {
    closeTransientUi()
  }

  const handleExportSceneJson = useCallbackRef(() => {
    const payload = serializeScene(scene)
    const blob = new Blob([payload], {type: 'application/json'})
    downloadBlob(blob, createSceneJsonFilename())
    toast.success('Scene JSON exported')
  })

  const handleExportSceneImage = useCallbackRef(() => {
    if (editorMode !== 'map' || !mapVisible) {
      toast.info('Switch to Map mode to export a scene image')
      return
    }

    const map = mapRef?.getMap?.()
    if (!map) {
      toast.error('Scene image export unavailable')
      return
    }

    try {
      const dataUrl = map.getCanvas().toDataURL('image/png')
      downloadDataUrl(dataUrl, createSceneImageFilename())
      toast.success('Scene image saved')
    } catch {
      toast.error('Scene image export failed')
    }
  })

  const handleMapStyleChange = useCallbackRef((style: SceneMapStyle) => {
    const nextScene = setMapStyle(style)
    recordAction({type: 'update', entity: 'map style'}, nextScene)
    setMapStyleOpen(false)
  })

  React.useEffect(() => {
    if (hasSeededHistoryRef.current) {
      return
    }

    if (pastEntries.length > 0) {
      hasSeededHistoryRef.current = true
      return
    }

    seedHistory(scene)
    hasSeededHistoryRef.current = true
  }, [pastEntries.length, scene, seedHistory])

  React.useEffect(() => {
    if (activeTool === 'select') {
      return
    }
    closeAllPanels()
  }, [activeTool, closeAllPanels])

  React.useEffect(() => {
    if (previousModeRef.current === mode) {
      return
    }

    previousModeRef.current = mode
    setViewMode(modePolicy.initialViewMode)
    setPreviewViewMode(modePolicy.defaultPreviewViewMode)
  }, [
    mode,
    modePolicy.defaultPreviewViewMode,
    modePolicy.initialViewMode,
    setPreviewViewMode,
    setViewMode,
  ])

  React.useEffect(() => {
    if (!modePolicy.lockViewMode) {
      return
    }

    if (viewMode === modePolicy.initialViewMode) {
      return
    }

    setViewMode(modePolicy.initialViewMode)
  }, [
    modePolicy.initialViewMode,
    modePolicy.lockViewMode,
    setViewMode,
    viewMode,
  ])

  React.useEffect(() => {
    if (viewMode === 'preview') {
      closeTransientUi()
      setEditMode(false)
      return
    }

    setEditMode(true)
    setActiveTool('select')
  }, [closeTransientUi, setEditMode, setActiveTool, viewMode])

  React.useEffect(() => {
    const preloadTimerId = window.setTimeout(() => {
      void loadSimulationCanvasModule()
    }, 800)

    return () => {
      window.clearTimeout(preloadTimerId)
    }
  }, [])

  useEditorShortcuts({
    // NOTE: Shortcuts are intentionally disabled for now. Do not re-enable
    // this without an explicit product request.
    enabled: false,
    isEditMode,
    hasAreas,
    isMapMode: editorMode === 'map',
    onSelectTool: setActiveTool,
    onSelectShapeMode: setShapeMode,
    onOpenPlaceDevice: () => setPlaceDeviceOpen(true),
    onPlacePerson: () => setActiveTool('place-person'),
    onSearchLocation: () => setSearchOpen(true),
    onOpenAreasPanel: () => setAreaPanelOpen(true),
    onOpenDevicesPanel: () => setDevicesPanelOpen(true),
    onUndo: () => handleUndo(),
    onRedo: () => handleRedo(),
    onEscape: () => closeTransientUi(),
  })

  return (
    <div
      className={cn(
        'vs:flex vs:w-full vs:min-h-0 vs:min-w-0 vs:flex-col',
        // DON't REMOVE THESE COMMENTS
        // viewMode === 'preview'
        //   ? 'h-svh min-h-0 overflow-hidden'
        //   : 'min-h-screen',
        'vs:size-full',
      )}
    >
      {viewMode === 'editor' ? (
        <TopPanel
          uiOverrides={uiOverrides?.topPanel}
          canRedo={canRedo}
          canUndo={canUndo}
          editorMode={editorMode}
          isEditMode={isEditMode}
          lastRedoDescription={lastRedoDescription}
          lastUndoDescription={lastUndoDescription}
          onBack={handleBack}
          onClearBoard={handleClearBoard}
          onEditModeChange={setEditMode}
          onEditorModeChange={handleEditorModeChange}
          onExportSceneImage={handleExportSceneImage}
          onExportSceneJson={handleExportSceneJson}
          onRedo={handleRedo}
          onSave={handleSave}
          onTogglePreview={() => setViewModeIfAllowed('preview')}
          onUndo={handleUndo}
          projectName={projectName}
          saveLoading={saveLoading}
        />
      ) : null}

      <main
        className={cn(
          'vs:flex vs:min-h-0 vs:min-w-0 vs:flex-1 vs:flex-col vs:size-full',
          viewMode === 'editor'
            ? 'vs:gap-4 vs:pt-14'
            : 'vs:gap-0 vs:overflow-hidden',
        )}
      >
        {viewMode === 'editor' ? (
          <ViewportShell
            mapVisible={mapVisible}
            activeTool={activeTool}
            editorMode={editorMode}
            onBlankClick={handleBlankClick}
            onMapReady={handleMapReady}
            shapeMode={shapeMode}
          />
        ) : (
          <SimulationAnalysisView
            allowBackToEditor={modePolicy.allowSimulationBackToEditor}
            allowPreviewViewSwitch={modePolicy.allowPreviewViewSwitch}
            hideAreaSelection={false}
            onBackToEditor={handleBackToEditor}
            showAuxiliaryPanels={modePolicy.showSimulationAuxiliaryPanels}
            showTopBar={modePolicy.showSimulationTopBar}
          />
        )}
      </main>

      {viewMode === 'editor' ? (
        <>
          <BottomNavigation
            hasAreas={hasAreas}
            activeTool={activeTool}
            isEditMode={isEditMode}
            onOpenPlaceDevice={() => setPlaceDeviceOpen(true)}
            onPlacePerson={() => setActiveTool('place-person')}
            onSelectShapeMode={setShapeMode}
            onSelectTool={setActiveTool}
            shapeMode={shapeMode}
          />

          <RightRail
            isEditMode={isEditMode}
            isMapMode={editorMode === 'map'}
            onAreaManagement={() => setAreaPanelOpen(true)}
            onDevicesInUse={() => setDevicesPanelOpen(true)}
            onMapViewMode={() => setMapStyleOpen(true)}
            onSearchLocation={() => setSearchOpen(true)}
          />

          <SearchLocationDialog
            mapRef={mapRef}
            onOpenChange={setSearchOpen}
            open={searchOpen}
          />

          <PlaceDeviceDialog
            nextColor={nextCameraColor}
            onOpenChange={setPlaceDeviceOpen}
            onSelectDevice={handleSelectDeviceProfile}
            open={placeDeviceOpen}
          />

          <AreaManagementDialog
            areaCount={areas.length}
            onOpenChange={setAreaPanelOpen}
            open={areaPanelOpen}
          />

          <DevicesDialog
            deviceCount={deviceCount}
            onOpenChange={setDevicesPanelOpen}
            open={devicesPanelOpen}
          />

          <AreaPropertiesSheet />
          <WallPropertiesSheet />
          <ShapePropertiesSheet />
          <PersonPropertiesSheet />
          <CameraPropertiesSheet />

          <MapStyleDialog
            value={mapStyle}
            onOpenChange={setMapStyleOpen}
            onValueChange={handleMapStyleChange}
            open={mapStyleOpen}
          />
        </>
      ) : null}

      <UnsavedChangesLeaveDialog
        isSaving={leaveDialogState.isSaving}
        title={leaveDialogConfig.title}
        description={leaveDialogConfig.description}
        onDiscardChanges={onConfirmDiscardAndLeave}
        onSaveAndLeave={onConfirmSaveAndLeave}
        onStay={onConfirmStay}
        open={leaveDialogState.open}
      />
    </div>
  )
}
