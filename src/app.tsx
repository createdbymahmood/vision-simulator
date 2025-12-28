import { useEffect, useMemo, useState } from "react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { Box, Map as MapIcon, ScanLine, Save } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider, useToast } from "@/components/ui/toast";
import {
  SceneStoreProvider,
  useSceneStore,
  useSceneSummary,
} from "@/domains/scene";
import { CanvasEditor } from "@/domains/scene/ui/canvas/canvas-editor";
import { PreviewPanel } from "@/domains/scene/ui/preview/preview-panel";
import { MapEditor } from "@/domains/scene/ui/map/map-editor";

export type View = "canvas" | "preview" | "map";

function AppShell() {
  const [view, setView] = useState<View>("canvas");
  const setMode = useSceneStore((state) => state.setMode);
  const exportSnapshot = useSceneStore((state) => state.exportSnapshot);
  const { push } = useToast();
  const summaryCounts = useSceneSummary();

  useEffect(() => {
    setMode(view === "map" ? "map" : "canvas");
  }, [setMode, view]);

  const summary = useMemo(
    () =>
      `${summaryCounts.walls} walls • ${summaryCounts.shapes} shapes • ${summaryCounts.cameras} cams • ${summaryCounts.people} people • ${summaryCounts.areas} areas`,
    [summaryCounts]
  );

  const onExport = useCallbackRef(() => {
    const payload = exportSnapshot();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "scene.json";
    anchor.click();
    URL.revokeObjectURL(url);
    push({ title: "Scene exported", description: "scene.json downloaded." });
  });

  const switchView = useCallbackRef((next: View) => {
    setView(next);
  });

  return (
    <div className="min-h-screen bg-background/60 px-6 py-6 text-foreground">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4">
        <header className="flex items-center justify-between rounded-3xl border border-border/70 bg-gradient-to-r from-card/90 via-card/70 to-card/90 px-6 py-4 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary shadow-inner shadow-primary/30">
              CV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold leading-tight">Simulation Analysis</h1>
                <Badge variant="secondary">Live</Badge>
              </div>
              <p className="text-sm text-muted-foreground">• Click a person to select and show trail</p>
              <p className="text-xs text-muted-foreground/80">{summary}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tabs
              value={view}
              onValueChange={(v) => switchView(v as View)}
              tabs={[
                { value: "canvas", label: "Canvas", icon: <Box className="h-4 w-4" /> },
                { value: "preview", label: "Preview", icon: <ScanLine className="h-4 w-4" /> },
                { value: "map", label: "Map", icon: <MapIcon className="h-4 w-4" /> },
              ]}
            />
            <Button variant="outline" onClick={onExport} className="gap-2">
              <Save className="h-4 w-4" /> Export JSON
            </Button>
          </div>
        </header>

        <main className="min-h-[78vh] rounded-3xl border border-border/70 bg-card/80 p-4 shadow-inner shadow-border/30 backdrop-blur">
          {view === "canvas" ? <CanvasEditor onPreview={() => switchView("preview")} /> : null}
          {view === "preview" ? <PreviewPanel /> : null}
          {view === "map" ? <MapEditor /> : null}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <SceneStoreProvider initialState={{}}>
        <AppShell />
      </SceneStoreProvider>
    </ToastProvider>
  );
}
