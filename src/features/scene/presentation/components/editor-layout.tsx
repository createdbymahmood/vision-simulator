import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import type {MapRef} from 'react-map-gl/mapbox'
import React from 'react'
import {toast} from 'sonner'

import {serializeScene} from '@/features/scene/application/utils/scene-serializer'
import {useHistoryStore} from '@/features/scene/infrastructure/stores/history.store'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {TopPanel} from '@/features/scene/presentation/components/top-panel'
import {
  createSceneImageFilename,
  createSceneJsonFilename,
  downloadBlob,
  downloadDataUrl,
} from '@/features/scene/presentation/utils/scene-export'
import {cn} from '@/lib/utils'

import type {SceneMapStyle, SceneMode, SceneRoot} from '../../domain/types'
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
import {ViewportShell} from './viewport-shell'

// eslint-disable-next-line max-lines-per-function, max-statements
export const EditorLayout: React.FC = () => {
  const [shapeMode, setShapeMode] = React.useState<ShapeDrawMode>('rectangle')
  const [measurementEnabled, setMeasurementEnabled] = React.useState(false)

  const [placeDeviceOpen, setPlaceDeviceOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [areaPanelOpen, setAreaPanelOpen] = React.useState(false)
  const [devicesPanelOpen, setDevicesPanelOpen] = React.useState(false)
  const [mapStyleOpen, setMapStyleOpen] = React.useState(false)
  const [mapRef, setMapRef] = React.useState<MapRef | null>(null)
  const hasSeededHistoryRef = React.useRef(false)

  const sceneMode = useSceneStore((state) => state.scene.mode)
  const mapVisible = useSceneStore((state) => state.scene.mapVisible)
  const mapStyle = useSceneStore((state) => state.scene.meta.mapStyle)
  const areas = useSceneStore((state) => state.scene.areas)
  const cameras = useSceneStore((state) => state.scene.cameras)
  const scene = useSceneStore((state) => state.scene)
  const setScene = useSceneStore((state) => state.setScene)
  const setSceneMode = useSceneStore((state) => state.setMode)
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

  const handleMapReady = useCallbackRef((nextMap: MapRef | null) => {
    setMapRef(nextMap)
  })

  const handleSceneModeChange = (mode: SceneMode) => {
    setSceneMode(mode)
    const nextScene = setMapVisibility(mode === 'map')
    recordAction({type: 'map-visibility', visible: mode === 'map'}, nextScene)
  }

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

  const handleSelectDevicePreset = (presetId: string) => {
    setActiveTool('place-camera')
    setCameraPlacement(presetId, nextCameraColor)
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
    if (sceneMode !== 'map' || !mapVisible) {
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
    closeAllPanels()
  }, [activeTool, closeAllPanels])

  React.useEffect(() => {
    if (viewMode === 'preview') {
      closeTransientUi()
      setEditMode(false)
      setMeasurementEnabled(false)
    } else {
      setEditMode(true)
    }
  }, [closeTransientUi, setEditMode, viewMode])

  useEditorShortcuts({
    enabled: viewMode === 'editor',
    isEditMode,
    hasAreas,
    isMapMode: sceneMode === 'map',
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
        'flex w-full flex-col',
        viewMode === 'preview'
          ? 'h-svh min-h-0 overflow-hidden'
          : 'min-h-screen',
      )}
    >
      {viewMode === 'editor' ? (
        <TopPanel
          canRedo={canRedo}
          canUndo={canUndo}
          isEditMode={isEditMode}
          lastRedoDescription={lastRedoDescription}
          lastUndoDescription={lastUndoDescription}
          onClearBoard={handleClearBoard}
          onEditModeChange={setEditMode}
          onExportSceneImage={handleExportSceneImage}
          onExportSceneJson={handleExportSceneJson}
          onRedo={handleRedo}
          onSceneModeChange={handleSceneModeChange}
          onTogglePreview={() => setViewMode('preview')}
          onUndo={handleUndo}
          sceneMode={sceneMode}
          viewMode={viewMode}
        />
      ) : null}

      <main
        className={`mx-auto flex min-h-0 flex-1 flex-col gap-4 size-full ${viewMode === 'editor' ? 'pt-14' : ''} ${viewMode === 'preview' ? 'overflow-hidden' : ''}`}
      >
        {viewMode === 'editor' ? (
          <ViewportShell
            mapVisible={mapVisible}
            measurementEnabled={measurementEnabled}
            activeTool={activeTool}
            onBlankClick={handleBlankClick}
            onToggleMeasurement={() => setMeasurementEnabled((prev) => !prev)}
            onMapReady={handleMapReady}
            sceneMode={sceneMode}
            shapeMode={shapeMode}
          />
        ) : (
          <SimulationAnalysisView />
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
            isMapMode={sceneMode === 'map'}
            onAreaManagement={() => setAreaPanelOpen(true)}
            onDevicesInUse={() => setDevicesPanelOpen(true)}
            onMapViewMode={() => setMapStyleOpen(true)}
            onSearchLocation={() => setSearchOpen(true)}
          />

          <SearchLocationDialog
            onOpenChange={setSearchOpen}
            onOpenMapStyles={() => setMapStyleOpen(true)}
            open={searchOpen}
          />

          <PlaceDeviceDialog
            nextColor={nextCameraColor}
            onOpenChange={setPlaceDeviceOpen}
            onSelectDevice={handleSelectDevicePreset}
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
            onOpenChange={setMapStyleOpen}
            onValueChange={handleMapStyleChange}
            open={mapStyleOpen}
            value={mapStyle}
          />
        </>
      ) : null}
    </div>
  )
}
