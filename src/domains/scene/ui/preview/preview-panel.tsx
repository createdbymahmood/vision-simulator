import { useState } from "react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { useSceneStore } from "../state/scene-store";
import { PreviewHeader } from "./components/preview-header";
import { PreviewViewport } from "./components/preview-viewport";
import { CctvFeeds } from "./components/cctv-feeds";
import { MiniMapCard } from "./components/mini-map-card";
import { useCanvasCapture } from "./hooks/use-canvas-capture";
import type { Vector2 } from "../../core/types";

export function PreviewPanel() {
  const cameras = useSceneStore((state) => state.cameras);
  const walls = useSceneStore((state) => state.walls);
  const shapes = useSceneStore((state) => state.shapes);
  const people = useSceneStore((state) => state.people);
  const playing = useSceneStore((state) => state.simulation.playing);
  const playAction = useSceneStore((state) => state.play);
  const pauseAction = useSceneStore((state) => state.pause);
  const setPreviewMode = useSceneStore((state) => state.setSimulationPreviewMode);
  const previewMode = useSceneStore((state) => state.simulation.previewMode);
  const selection = useSceneStore((state) => state.selected);
  const setSelection = useSceneStore((state) => state.setSelection);
  const areas = useSceneStore((state) => state.areas);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [focus, setFocus] = useState<Vector2>({ x: 0, y: 0 });
  const [showMap, setShowMap] = useState(true);
  const { recording, snapshot, toggleRecording } = useCanvasCapture(canvasEl);

  const selectedId = selection && "id" in selection ? selection.id : null;

  const togglePlay = useCallbackRef(() => {
    if (playing) pauseAction();
    else playAction();
  });

  return (
    <div className="grid h-full grid-cols-[2fr_1fr] gap-3">
      <div className="flex flex-col gap-3">
        <PreviewHeader
          playing={playing}
          onTogglePlay={togglePlay}
          previewMode={previewMode}
          onPreviewMode={setPreviewMode}
          onSnapshot={snapshot}
          recording={recording}
          onToggleRecording={toggleRecording}
          areas={areas}
          onAreaFocus={(id) => {
            const area = areas.find((a) => a.id === id);
            if (area) {
              setSelection({ kind: "area", id });
              setFocus(centroidOfArea(area.geometry.points));
            }
          }}
          mapVisible={showMap}
          onToggleMapVisible={(on) => setShowMap(on)}
        />

        <div className="relative min-h-[60vh] overflow-hidden rounded-3xl border border-border/70 bg-card/60">
          <PreviewViewport
            walls={walls}
            shapes={shapes}
            cameras={cameras}
            people={people}
            selectedId={selectedId}
            onPersonSelect={(id) => setSelection({ kind: "person", id })}
            focus={focus}
            showMap={showMap}
            onCreated={setCanvasEl}
          />
        </div>
      </div>

      <div className="flex h-full flex-col gap-3">
        <MiniMapCard
          walls={walls}
          shapes={shapes}
          cameras={cameras}
          people={people}
          selectedId={selectedId}
          onPersonSelect={(id) => setSelection({ kind: "person", id })}
        />
        <CctvFeeds cameras={cameras} />
      </div>
    </div>
  );
}

function centroidOfArea(points: Vector2[]): Vector2 {
  if (!points.length) return { x: 0, y: 0 };
  const sum = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}
