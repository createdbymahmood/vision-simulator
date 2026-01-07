import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import {useHistoryStore} from '@/features/scene/infrastructure/stores/history.store'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {TopPanel} from '@/features/scene/presentation/components/top-panel'

import {assignCameraColor} from '../../domain/services/color-assignment'
import type {SceneMode} from '../../domain/types'
import type {ShapeDrawMode} from '../types'

import {createInitialScene} from '../../domain/services/scene-factory'
import {useEditorShortcuts} from '../hooks/use-editor-shortcuts'
import {BottomNavigation} from './bottom-navigation'
import {AreaPropertiesSheet} from './properties-sheet/area-properties-sheet'
import {CameraPropertiesSheet} from './properties-sheet/camera-properties-sheet'
import {PersonPropertiesSheet} from './properties-sheet/person-properties-sheet'
import {ShapePropertiesSheet} from './properties-sheet/shape-properties-sheet'
import {
  AreaManagementDialog,
  DevicesDialog,
  MapStyleDialog,
  PlaceDeviceDialog,
  SearchLocationDialog,
} from './editor-dialogs'
import {RightRail} from './right-rail'
import {ViewportShell} from './viewport-shell'
import {WallPropertiesSheet} from './properties-sheet/wall-properties-sheet'

// eslint-disable-next-line max-lines-per-function, max-statements
export const EditorLayout: React.FC = () => {
  const [shapeMode, setShapeMode] = React.useState<ShapeDrawMode>('rectangle')
  const [measurementEnabled, setMeasurementEnabled] = React.useState(false)

  const [placeDeviceOpen, setPlaceDeviceOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [areaPanelOpen, setAreaPanelOpen] = React.useState(false)
  const [devicesPanelOpen, setDevicesPanelOpen] = React.useState(false)
  const [mapStyleOpen, setMapStyleOpen] = React.useState(false)
  const applyingHistoryRef = React.useRef(false)
  const hasRecordedInitialRef = React.useRef(false)

  const sceneMode = useSceneStore((state) => state.scene.mode)
  const mapVisible = useSceneStore((state) => state.scene.mapVisible)
  const areas = useSceneStore((state) => state.scene.areas)
  const cameras = useSceneStore((state) => state.scene.cameras)
  const scene = useSceneStore((state) => state.scene)
  const setScene = useSceneStore((state) => state.setScene)
  const setSceneMode = useSceneStore((state) => state.setMode)
  const setMapVisibility = useSceneStore((state) => state.setMapVisibility)
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
  const clearHistory = useHistoryStore((state) => state.clear)
  const recordHistory = useHistoryStore((state) => state.record)

  const lastActionDescription = pastEntries.at(-1)?.description
  const canUndo = pastEntries.length > 0
  const canRedo = futureEntries.length > 0
  const hasAreas = areas.length > 0
  const deviceCount = cameras.length
  const nextCameraColor = React.useMemo(
    () => assignCameraColor(cameras.length),
    [cameras.length],
  )

  const closeTransientUi = useCallbackRef(() => {
    setPlaceDeviceOpen(false)
    setSearchOpen(false)
    setAreaPanelOpen(false)
    setDevicesPanelOpen(false)
    setMapStyleOpen(false)
    closeAllPanels()
    closeAllPopovers()
  })

  const handleSceneModeChange = (mode: SceneMode) => {
    setSceneMode(mode)
    setMapVisibility(mode === 'map')
  }

  const handleUndo = () => {
    const entry = undoScene(scene)
    if (entry) {
      applyingHistoryRef.current = true
      setScene(entry.scene)
    }
  }

  const handleRedo = () => {
    const entry = redoScene(scene)
    if (entry) {
      applyingHistoryRef.current = true
      setScene(entry.scene)
    }
  }

  const handleClearBoard = () => {
    clearHistory()
    setScene(createInitialScene())
    clearSelection()
    setActiveTool('select')
  }

  const handleSelectDevicePreset = (presetId: string) => {
    setActiveTool('place-camera')
    setCameraPlacement(presetId, nextCameraColor)
    setPlaceDeviceOpen(false)
  }

  const handleBlankClick = () => {
    closeTransientUi()
  }

  const historyDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  React.useEffect(() => {
    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current)
    }

    if (applyingHistoryRef.current) {
      applyingHistoryRef.current = false
      return
    }
    if (!hasRecordedInitialRef.current) {
      hasRecordedInitialRef.current = true
      return
    }

    historyDebounceRef.current = setTimeout(() => {
      recordHistory(scene)
    }, 300)
  }, [recordHistory, scene])

  React.useEffect(
    () => () => {
      if (historyDebounceRef.current) {
        clearTimeout(historyDebounceRef.current)
      }
    },
    [],
  )

  React.useEffect(() => {
    closeAllPanels()
  }, [activeTool, closeAllPanels])

  useEditorShortcuts({
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
    <div className='min-h-screen w-full flex flex-col'>
      <TopPanel
        canRedo={canRedo}
        canUndo={canUndo}
        isEditMode={isEditMode}
        lastActionDescription={lastActionDescription}
        onClearBoard={handleClearBoard}
        onEditModeChange={setEditMode}
        onRedo={handleRedo}
        onSceneModeChange={handleSceneModeChange}
        onTogglePreview={() =>
          setViewMode(viewMode === 'preview' ? 'editor' : 'preview')
        }
        onUndo={handleUndo}
        sceneMode={sceneMode}
        viewMode={viewMode}
      />

      <main className='mx-auto flex flex-col gap-4 size-full flex-1 pt-14'>
        <ViewportShell
          mapVisible={mapVisible}
          measurementEnabled={measurementEnabled}
          activeTool={activeTool}
          onBlankClick={handleBlankClick}
          onToggleMeasurement={() => setMeasurementEnabled((prev) => !prev)}
          sceneMode={sceneMode}
          shapeMode={shapeMode}
        />
      </main>

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
        onOpenChange={setPlaceDeviceOpen}
        onSelectDevice={handleSelectDevicePreset}
        nextColor={nextCameraColor}
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

      <MapStyleDialog onOpenChange={setMapStyleOpen} open={mapStyleOpen} />
    </div>
  )
}
