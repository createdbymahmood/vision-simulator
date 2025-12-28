import { useEffect, useMemo, useState } from "react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { Box, Map as MapIcon, ScanLine } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <div className="flex items-center justify-between rounded-3xl border border-border/70 bg-card/80 px-6 py-3 shadow-sm">
          <Tabs value={view} onValueChange={(v) => switchView(v as View)}>
            <TabsList>
              <TabsTrigger value="canvas" className="gap-1">
                <Box className="h-4 w-4" /> Canvas
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-1">
                <ScanLine className="h-4 w-4" /> Preview
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-1">
                <MapIcon className="h-4 w-4" /> Map
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">{summary}</p>
        </div>

        <main className="min-h-[78vh] rounded-3xl border border-border/70 bg-card/80 p-4 shadow-inner shadow-border/30 backdrop-blur">
          {view === "canvas" ? <CanvasEditor onPreview={() => switchView("preview")} onExport={onExport} /> : null}
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
