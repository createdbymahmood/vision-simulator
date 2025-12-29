import { useEffect, useMemo, useState } from "react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";

import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CanvasBottomToolbar } from "./bottom-toolbar";
import { CanvasStage } from "./stage-canvas";
import { CanvasTopPanel } from "./top-panel";
import { useElementSize } from "./hooks";
import type { CanvasPoint } from "./types";
import type { SceneBackground, SceneEntityKind, SceneShapeKind, SceneTool } from "../../core/scene-types";
import { useSceneHistoryStore } from "../scene-history-store";
import { useSceneStore } from "../scene-store";

export function CanvasEditor() {
  const [boardRef, boardSize] = useElementSize<HTMLDivElement>();
  const [offset, setOffset] = useState<CanvasPoint>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [shapeTool, setShapeTool] = useState<SceneShapeKind>("rectangle");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const scene = useSceneStore((state) => state.scene);
  const selection = useSceneStore((state) => state.selection);
  const activeTool = useSceneStore((state) => state.activeTool);
  const setActiveTool = useSceneStore((state) => state.setActiveTool);
  const setSceneMode = useSceneStore((state) => state.setSceneMode);
  const setSceneBackground = useSceneStore((state) => state.setSceneBackground);
  const toggleSelectionMode = useSceneStore((state) => state.toggleSelectionMode);
  const setActivePopover = useSceneStore((state) => state.setActivePopover);
  const selectEntity = useSceneStore((state) => state.selectEntity);
  const closeOverlays = useSceneStore((state) => state.closeOverlays);
  const addWall = useSceneStore((state) => state.addWall);
  const addShape = useSceneStore((state) => state.addShape);
  const updateShape = useSceneStore((state) => state.updateShape);
  const addCamera = useSceneStore((state) => state.addCamera);
  const addPerson = useSceneStore((state) => state.addPerson);
  const resetScene = useSceneStore((state) => state.resetScene);
  const hydrateScene = useSceneStore((state) => state.hydrateScene);
  const autosave = useSceneStore((state) => state.autosave);

  const captureSnapshot = useSceneHistoryStore((state) => state.captureSnapshot);
  const undoSnapshot = useSceneHistoryStore((state) => state.undo);
  const redoSnapshot = useSceneHistoryStore((state) => state.redo);
  const clearHistory = useSceneHistoryStore((state) => state.clearHistory);
  const historyPast = useSceneHistoryStore((state) => state.past);
  const historyFuture = useSceneHistoryStore((state) => state.future);

  useEffect(() => {
    setSceneMode("canvas");
  }, [setSceneMode]);

  const autosaveLabel = useMemo(() => {
    if (autosave.status === "saving") {
      return "Autosaving…";
    }
    if (autosave.lastSavedAt) {
      return `Saved ${new Date(autosave.lastSavedAt).toLocaleTimeString()}`;
    }
    return "Autosave ready";
  }, [autosave.lastSavedAt, autosave.status]);

  const activeShapeKindLabel = useMemo(() => {
    if (shapeTool === "rectangle") return "Rectangle";
    if (shapeTool === "circle") return "Circle";
    if (shapeTool === "triangle") return "Triangle";
    return "Line";
  }, [shapeTool]);

  const handleClearBoard = useCallbackRef(() => {
    clearHistory();
    resetScene();
    setClearDialogOpen(false);
  });

  const handleUndo = useCallbackRef(() => {
    const previous = undoSnapshot(scene);
    if (previous) {
      hydrateScene(previous);
    }
  });

  const handleRedo = useCallbackRef(() => {
    const next = redoSnapshot(scene);
    if (next) {
      hydrateScene(next);
    }
  });

  const handleExport = useCallbackRef(() => {
    const blob = new Blob([JSON.stringify(scene, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scene-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  const handleBackgroundImage = useCallbackRef(() => {
    const url = window.prompt("Enter background image URL");
    if (!url) {
      return;
    }
    captureSnapshot(scene);
    setSceneBackground({
      type: "image",
      value: url,
      opacity: 0.4,
    } as SceneBackground);
  });

  const handleLivePreview = useCallbackRef(() => {
    alert("Live preview not implemented yet");
  });

  const handleSelectEntity = useCallbackRef(
    (payload: { id: string; kind: SceneEntityKind } | null) => {
      selectEntity(payload);
    }
  );

  const handleToolChange = useCallbackRef((tool: SceneTool) => {
    setActiveTool(tool);
    setActivePopover(null);
  });

  const handleShapeSelect = useCallbackRef((kind: SceneShapeKind) => {
    setShapeTool(kind);
    setActiveTool("shape");
  });

  const activeToolLabel = useMemo(() => {
    if (activeTool === "select") return "Selection";
    if (activeTool === "wall") return "Draw wall";
    if (activeTool === "shape") return `Draw ${activeShapeKindLabel}`;
    if (activeTool === "camera") return "Place camera";
    if (activeTool === "person") return "Place person";
    return "Tool";
  }, [activeShapeKindLabel, activeTool]);

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex items-center gap-2 px-6 pt-2">
        <Badge variant="outline">Active tool</Badge>
        <Badge variant="secondary">{activeToolLabel}</Badge>
      </div>

      <CanvasTopPanel
        autosaveLabel={autosaveLabel}
        editMode={editMode}
        snapEnabled={snapEnabled}
        canUndo={Boolean(historyPast.length)}
        canRedo={Boolean(historyFuture.length)}
        onToggleEditMode={setEditMode}
        onToggleSnap={setSnapEnabled}
        onClearBoard={() => setClearDialogOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        onLivePreview={handleLivePreview}
      />

      <div
        ref={boardRef}
        className="relative h-[calc(100vh-18rem)] min-h-[640px] w-full overflow-hidden"
      >
        <CanvasStage
          size={boardSize}
          offset={offset}
          scale={scale}
          snapEnabled={snapEnabled}
          editMode={editMode}
          shapeTool={shapeTool}
          scene={scene}
          selection={selection}
          activeTool={activeTool}
          onOffsetChange={setOffset}
          onScaleChange={setScale}
          onCaptureSnapshot={captureSnapshot}
          onAddWall={addWall}
          onAddShape={addShape}
        onUpdateShape={updateShape}
        onAddCamera={addCamera}
        onAddPerson={addPerson}
        onSelectEntity={handleSelectEntity}
        onCloseOverlays={closeOverlays}
      />
      </div>

      <CanvasBottomToolbar
        activeTool={activeTool}
        activeShapeLabel={activeShapeKindLabel}
        selectionMode={selection.mode}
        onToggleSelectionMode={toggleSelectionMode}
        onToolChange={handleToolChange}
        onShapeSelect={handleShapeSelect}
        onBackgroundClick={handleBackgroundImage}
        wallCount={scene.walls.length}
        shapeCount={scene.shapes.length}
      />

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
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
            <Button variant="destructive" onClick={handleClearBoard}>
              Clear
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

CanvasEditor.displayName = "canvas-editor";
