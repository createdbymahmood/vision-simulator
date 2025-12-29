import { useEffect, useMemo } from "react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { MapIcon, SquareStackIcon, VideoIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  SceneEntity,
  SceneEntityKind,
  SceneMode,
  SceneTool,
} from "../core/scene-types";
import { CanvasEditor } from "./canvas-editor";
import { useSceneStore } from "./scene-store";

function SceneTopBar({
  mode,
  autosaveLabel,
  onModeChange,
  onOpenCommandPalette,
  onResetScene,
}: {
  mode: SceneMode;
  autosaveLabel: string;
  onModeChange: (mode: SceneMode) => void;
  onOpenCommandPalette: () => void;
  onResetScene: () => void;
}) {
  return (
    <div className="fixed left-0 right-0 top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Computer Vision Simulator</Badge>
          <Badge>Phase 2 — Canvas</Badge>
          <span className="text-muted-foreground text-xs">{autosaveLabel}</span>
        </div>
        <div className="flex h-6 items-center">
          <Separator orientation="vertical" />
        </div>
        <Tabs
          value={mode}
          onValueChange={(value) => onModeChange(value as SceneMode)}
        >
          <TabsList>
            <TabsTrigger value="canvas">
              <SquareStackIcon className="mr-2 size-4" />
              Canvas
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapIcon className="mr-2 size-4" />
              Map
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex h-6 items-center">
          <Separator orientation="vertical" />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={onOpenCommandPalette}>
              <VideoIcon className="mr-2 size-4" />
              Command / Overlays
            </Button>
          </TooltipTrigger>
          <TooltipContent>Opens the global command palette.</TooltipContent>
        </Tooltip>
        <Button variant="ghost" onClick={onResetScene}>
          Reset scene
        </Button>
      </div>
    </div>
  );
}

function SceneWorkspacePlaceholder() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-6">
      <Card>
        <CardHeader>
          <CardTitle>Map Editor</CardTitle>
          <CardDescription>
            Map mode placeholder — canvas editor is active for this phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Switch back to Canvas to continue building the simulation layout.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PropertiesSidebar({
  open,
  selected,
  onClose,
}: {
  open: boolean;
  selected: SceneEntity | null;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Properties</SheetTitle>
          <SheetDescription>
            Contextual inspector driven by scene selection.
          </SheetDescription>
        </SheetHeader>
        {selected ? (
          <div className="space-y-4">
            <div className="text-sm font-medium">
              {selected.id} ({(selected as { type?: string }).type ?? "entity"})
            </div>
            <Separator />
            <pre className="text-xs leading-6">
              {JSON.stringify(selected, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Nothing selected. Click an entity chip or the workspace to close.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SceneCommandPalette({
  open,
  onOpenChange,
  onSelectMode,
  onSelectTool,
  onResetScene,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMode: (mode: SceneMode) => void;
  onSelectTool: (tool: SceneTool) => void;
  onResetScene: () => void;
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to a command" />
      <CommandList>
        <CommandGroup heading="Modes">
          <CommandItem onSelect={() => onSelectMode("canvas")}>
            Canvas mode
          </CommandItem>
          <CommandItem onSelect={() => onSelectMode("map")}>
            Map mode
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Tools">
          <CommandItem onSelect={() => onSelectTool("select")}>
            Select
          </CommandItem>
          <CommandItem onSelect={() => onSelectTool("wall")}>Wall</CommandItem>
          <CommandItem onSelect={() => onSelectTool("camera")}>
            Camera
          </CommandItem>
          <CommandItem onSelect={() => onSelectTool("shape")}>
            Shape
          </CommandItem>
          <CommandItem onSelect={() => onSelectTool("person")}>
            Person
          </CommandItem>
          <CommandItem onSelect={() => onSelectTool("area")}>Area</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Scene">
          <CommandItem onSelect={onResetScene}>Reset scene</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function SceneLayout() {
  const scene = useSceneStore((state) => state.scene);
  const selection = useSceneStore((state) => state.selection);
  const overlays = useSceneStore((state) => state.overlays);
  const autosave = useSceneStore((state) => state.autosave);

  const setActiveTool = useSceneStore((state) => state.setActiveTool);
  const setSceneMode = useSceneStore((state) => state.setSceneMode);
  const setCommandPaletteOpen = useSceneStore(
    (state) => state.setCommandPaletteOpen
  );
  const selectEntity = useSceneStore((state) => state.selectEntity);
  const closeOverlays = useSceneStore((state) => state.closeOverlays);
  const resetScene = useSceneStore((state) => state.resetScene);

  const autosaveLabel = useMemo(() => {
    if (autosave.status === "saving") {
      return "Autosaving…";
    }
    if (autosave.lastSavedAt) {
      return `Saved ${new Date(autosave.lastSavedAt).toLocaleTimeString()}`;
    }
    return "Autosave ready";
  }, [autosave.lastSavedAt, autosave.status]);

  const selectedEntity = useMemo<SceneEntity | null>(() => {
    if (!selection.selectedEntityId || !selection.selectedEntityKind) {
      return null;
    }

    const collections: Record<SceneEntityKind, SceneEntity[]> = {
      wall: scene.walls,
      shape: scene.shapes,
      camera: scene.cameras,
      person: scene.people,
      area: scene.areas,
    };

    return (
      collections[selection.selectedEntityKind].find(
        (entity) => entity.id === selection.selectedEntityId
      ) ?? null
    );
  }, [scene, selection.selectedEntityId, selection.selectedEntityKind]);

  const onOpenCommandPalette = useCallbackRef(() => {
    setCommandPaletteOpen(true);
  });

  const onCommandToggle = useCallbackRef((next: boolean) => {
    setCommandPaletteOpen(next);
    if (!next) {
      closeOverlays();
    }
  });

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeOverlays();
        selectEntity(null);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [closeOverlays, selectEntity]);

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground pt-16 pb-16">
      <SceneTopBar
        mode={scene.mode}
        autosaveLabel={autosaveLabel}
        onModeChange={setSceneMode}
        onOpenCommandPalette={onOpenCommandPalette}
        onResetScene={resetScene}
      />
      <main className="flex min-h-[calc(100vh-8rem)] flex-col pt-8">
        {scene.mode === "canvas" ? (
          <CanvasEditor />
        ) : (
          <SceneWorkspacePlaceholder />
        )}
      </main>
      <PropertiesSidebar
        open={overlays.isPropertiesOpen && Boolean(selectedEntity)}
        selected={selectedEntity}
        onClose={() => {
          closeOverlays();
          selectEntity(null);
        }}
      />
      <SceneCommandPalette
        open={overlays.isCommandPaletteOpen}
        onOpenChange={onCommandToggle}
        onSelectMode={setSceneMode}
        onSelectTool={setActiveTool}
        onResetScene={resetScene}
      />
    </div>
  );
}

SceneLayout.displayName = "scene-layout";
SceneTopBar.displayName = "scene-top-bar";
SceneWorkspacePlaceholder.displayName = "scene-workspace-placeholder";
PropertiesSidebar.displayName = "properties-sidebar";
SceneCommandPalette.displayName = "scene-command-palette";
