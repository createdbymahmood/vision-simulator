import { useEffect, useRef, useState } from "react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { useToast } from "@/components/ui/toast";
import type { SelectionKind } from "../../core/types";
import { PropertiesPanel } from "../shared/properties-panel";
import { useStageSize } from "./hooks/use-stage-size";
import { CanvasToolbar } from "./components/canvas-toolbar";
import { CanvasBottomNav } from "./components/canvas-bottom-nav";
import { CanvasStage, type CanvasStageHandle } from "./components/canvas-stage";
import { useSceneStore } from "../state/scene-store";

interface CanvasEditorProps {
  onPreview: () => void;
  onExport: () => void;
}

export function CanvasEditor({ onPreview, onExport }: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageHandle = useRef<CanvasStageHandle>(null);
  const size = useStageSize(containerRef);
  const { push } = useToast();
  const state = useSceneStore((store) => store);
  const [invalidAction, setInvalidAction] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!invalidAction) return;
    const timer = setTimeout(() => setInvalidAction(null), 1500);
    return () => clearTimeout(timer);
  }, [invalidAction]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.setBackground({
        ...(state.background ?? {
          id: crypto.randomUUID(),
          opacity: 0.6,
          scale: 1,
          rotation: 0,
          position: { x: 0, y: 0 },
          locked: false,
        }),
        imageDataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const onClear = () => {
    const confirmed = window.confirm("Clear the board? This removes all objects.");
    if (confirmed) state.clearScene();
  };

  const exportTopDown = useCallbackRef(() => {
    const uri = stageHandle.current?.exportImage();
    if (!uri) return;
    const link = document.createElement("a");
    link.href = uri;
    link.download = "scene.png";
    link.click();
    push({ title: "Snapshot saved", description: "Top-down PNG exported." });
  });

  const handleSelect = (selection: SelectionKind | null) => state.setSelection(selection);

  return (
    <div className="flex h-full gap-3">
      <div className="flex w-full flex-col gap-3" ref={containerRef} style={{ minHeight: "70vh" }}>
        <CanvasToolbar
          selectionMode={state.selectionMode}
          grid={state.grid}
          onToggleSelection={() => state.setSelectionMode(!state.selectionMode)}
          onGridChange={state.setGrid}
          onUndo={state.undo}
          onRedo={state.redo}
          onClear={onClear}
          onPreview={onPreview}
          onExportTopDown={exportTopDown}
          onExportJson={onExport}
        />

        <CanvasStage
          ref={stageHandle}
          size={size}
          grid={state.grid}
          background={state.background}
          shapes={state.shapes}
          walls={state.walls}
          cameras={state.cameras}
          people={state.people}
          showTrails={state.simulation.showTrails}
          selectionMode={state.selectionMode}
          activeTool={state.activeTool}
          onSelect={handleSelect}
          onAddWall={state.addWall}
          onAddShape={state.addShape}
          onAddCamera={(point) => state.addCamera(point, "basic")}
          onAddPerson={(point) => state.addPerson(point)}
          onBackgroundSelect={() => state.setSelection({ kind: "background" })}
          onInvalid={(msg) => {
            setInvalidAction(msg);
            if (msg) push({ title: "Invalid action", description: msg });
          }}
        />

        <CanvasBottomNav
          activeTool={state.activeTool}
          onSelectTool={(tool) => state.setActiveTool(tool)}
          onBackgroundPick={() => fileInputRef.current?.click()}
        />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </div>

      <PropertiesPanel selection={state.selected} />
    </div>
  );
}
