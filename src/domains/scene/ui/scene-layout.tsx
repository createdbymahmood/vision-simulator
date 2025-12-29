import type { PointerEvent } from "react";
import { useEffect, useMemo } from "react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import {
  CameraIcon,
  MapIcon,
  MousePointer2Icon,
  PersonStandingIcon,
  ShapesIcon,
  SquareStackIcon,
  VideoIcon,
} from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  Scene,
  SceneEntity,
  SceneEntityKind,
  SceneMode,
  SceneTool,
} from "../core/scene-types";
import { useSceneStore } from "./scene-store";

function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `scene-${Date.now()}`;
}

function SceneTopBar({
  mode,
  selectionMode,
  autosaveLabel,
  onModeChange,
  onToggleSelectionMode,
  onOpenCommandPalette,
  onResetScene,
}: {
  mode: SceneMode;
  selectionMode: "single" | "multi";
  autosaveLabel: string;
  onModeChange: (mode: SceneMode) => void;
  onToggleSelectionMode: () => void;
  onOpenCommandPalette: () => void;
  onResetScene: () => void;
}) {
  return (
    <div className="fixed left-0 right-0 top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Computer Vision Simulator</Badge>
          <Badge>Phase 1 — Foundation</Badge>
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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={selectionMode === "multi"}
              onCheckedChange={() => onToggleSelectionMode()}
              id="multi-select"
            />
            <label
              htmlFor="multi-select"
              className="text-muted-foreground text-sm"
            >
              Multi-select
            </label>
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
    </div>
  );
}

function SceneWorkspace({
  scene,
  onBlankSpacePointerDown,
  onQuickAdd,
  onSelectEntity,
}: {
  scene: Scene;
  onBlankSpacePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onQuickAdd: (kind: SceneEntityKind) => void;
  onSelectEntity: (entity: { id: string; kind: SceneEntityKind }) => void;
}) {
  const hasEntities =
    scene.walls.length ||
    scene.shapes.length ||
    scene.cameras.length ||
    scene.people.length ||
    scene.areas.length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-6">
      <Card>
        <CardHeader>
          <CardTitle>Editor Workspace</CardTitle>
          <CardDescription>
            Click blank space to dismiss overlays. Use the quick add buttons to
            seed the shared scene state.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="relative flex min-h-[420px] flex-col gap-4 rounded-xl border border-dashed p-4"
            onPointerDown={onBlankSpacePointerDown}
          >
            <div className="pointer-events-none absolute inset-0 rounded-xl" />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuickAdd("wall")}
              >
                Add wall
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuickAdd("shape")}
              >
                Add shape
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuickAdd("camera")}
              >
                Add camera
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuickAdd("person")}
              >
                Add person
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuickAdd("area")}
              >
                Add area
              </Button>
            </div>
            <Separator />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Scene mode</CardTitle>
                  <CardDescription>Active: {scene.mode}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>Units: {scene.units}</div>
                    <div>Version: {scene.version}</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Entities</CardTitle>
                  <CardDescription>
                    Click an item to open the contextual sidebar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {hasEntities ? (
                      <>
                        {scene.walls.map((wall) => (
                          <Button
                            key={wall.id}
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              onSelectEntity({ id: wall.id, kind: "wall" })
                            }
                          >
                            Wall {wall.id.slice(0, 4)}
                          </Button>
                        ))}
                        {scene.shapes.map((shape) => (
                          <Button
                            key={shape.id}
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              onSelectEntity({ id: shape.id, kind: "shape" })
                            }
                          >
                            Shape {shape.type}
                          </Button>
                        ))}
                        {scene.cameras.map((camera) => (
                          <Button
                            key={camera.id}
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              onSelectEntity({ id: camera.id, kind: "camera" })
                            }
                          >
                            Camera {camera.typePreset}
                          </Button>
                        ))}
                        {scene.people.map((person) => (
                          <Button
                            key={person.id}
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              onSelectEntity({ id: person.id, kind: "person" })
                            }
                          >
                            Person {person.id.slice(0, 4)}
                          </Button>
                        ))}
                        {scene.areas.map((area) => (
                          <Button
                            key={area.id}
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              onSelectEntity({ id: area.id, kind: "area" })
                            }
                          >
                            Area {area.name}
                          </Button>
                        ))}
                      </>
                    ) : (
                      <Badge variant="outline">No entities yet</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SceneBottomBar({
  scene,
  activeTool,
  onToolChange,
}: {
  scene: Scene;
  activeTool: SceneTool;
  onToolChange: (tool: SceneTool) => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
      <div className="flex h-16 w-fit items-center gap-6 rounded-full border bg-background/95 px-6 shadow-md backdrop-blur">
        {/* <div className="flex min-w-0 flex-1 items-center gap-2">
          <Badge variant="outline">Active tool</Badge>
          <span className="text-sm font-medium capitalize">{activeTool}</span>
        </div> */}
        <div className="flex flex-1 items-center justify-center">
          <ToggleGroup
            type="single"
            value={activeTool}
            onValueChange={(value) => {
              if (value) {
                onToolChange(value as SceneTool);
              }
            }}
            spacing={4}
          >
            <ToggleGroupItem
              value="select"
              aria-label="Select tool"
              className="rounded-full"
            >
              <MousePointer2Icon className="size-4" />
              Select
            </ToggleGroupItem>
            <ToggleGroupItem
              value="camera"
              aria-label="Camera tool"
              className="rounded-full"
            >
              <CameraIcon className="size-4" />
              Camera
            </ToggleGroupItem>
            <ToggleGroupItem
              value="shape"
              aria-label="Shape tool"
              className="rounded-full"
            >
              <ShapesIcon className="size-4" />
              Shape
            </ToggleGroupItem>
            <ToggleGroupItem
              value="person"
              aria-label="Person tool"
              className="rounded-full"
            >
              <PersonStandingIcon className="size-4" />
              Person
            </ToggleGroupItem>
            <ToggleGroupItem
              value="area"
              aria-label="Area tool"
              className="rounded-full"
            >
              <MapIcon className="size-4" />
              Area
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        {/* <div className="hidden flex-1 items-center justify-end gap-3 text-sm md:flex">
          <Badge variant="secondary">Walls: {scene.walls.length}</Badge>
          <Badge variant="secondary">Shapes: {scene.shapes.length}</Badge>
          <Badge variant="secondary">Cameras: {scene.cameras.length}</Badge>
          <Badge variant="secondary">People: {scene.people.length}</Badge>
          <Badge variant="secondary">Areas: {scene.areas.length}</Badge>
        </div> */}
      </div>
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
  const activeTool = useSceneStore((state) => state.activeTool);

  const setActiveTool = useSceneStore((state) => state.setActiveTool);
  const setSceneMode = useSceneStore((state) => state.setSceneMode);
  const toggleSelectionMode = useSceneStore(
    (state) => state.toggleSelectionMode
  );
  const setCommandPaletteOpen = useSceneStore(
    (state) => state.setCommandPaletteOpen
  );
  const selectEntity = useSceneStore((state) => state.selectEntity);
  const closeOverlays = useSceneStore((state) => state.closeOverlays);
  const resetScene = useSceneStore((state) => state.resetScene);
  const addWall = useSceneStore((state) => state.addWall);
  const addShape = useSceneStore((state) => state.addShape);
  const addCamera = useSceneStore((state) => state.addCamera);
  const addPerson = useSceneStore((state) => state.addPerson);
  const addArea = useSceneStore((state) => state.addArea);

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

  const onBlankSpacePointerDown = useCallbackRef(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }
      closeOverlays();
      selectEntity(null);
    }
  );

  const onQuickAdd = useCallbackRef((kind: SceneEntityKind) => {
    const id = createId();
    if (kind === "wall") {
      addWall({
        id,
        type: "wall",
        coordinates: { x1: 0, y1: 0, x2: 6, y2: 0 },
        height: 3,
        thickness: 0.25,
        color: "#0f172a",
        opacity: 0.9,
      });
    }
    if (kind === "shape") {
      addShape({
        id,
        type: "rectangle",
        x: 2,
        y: 1,
        rotation: 0,
        width: 2,
        length: 1.5,
        height: 0.2,
        color: "#111827",
        opacity: 0.6,
        lineThickness: 0.1,
      });
    }
    if (kind === "camera") {
      addCamera({
        id,
        typePreset: "fixed",
        x: 5,
        y: 3,
        height: 2.5,
        direction: 45,
        fov: 90,
        depth: 12,
        zoom: 1,
        resolution: "1080p",
        nearPlane: 0.2,
      });
    }
    if (kind === "person") {
      addPerson({
        id,
        x: 1,
        y: 1,
        radius: 0.25,
        height: 1.75,
        speed: 1.4,
        behavior: "patrol",
        trailEnabled: true,
      });
    }
    if (kind === "area") {
      addArea({
        id,
        name: "Zone",
        geometry: [
          { lat: 37.7749, lng: -122.4194 },
          { lat: 37.7755, lng: -122.4187 },
          { lat: 37.7743, lng: -122.4182 },
          { lat: 37.7737, lng: -122.4189 },
        ],
        pointCount: 4,
      });
    }
    selectEntity({ id, kind });
  });

  const onOpenCommandPalette = useCallbackRef(() => {
    setCommandPaletteOpen(true);
  });

  const onCommandToggle = useCallbackRef((next: boolean) => {
    setCommandPaletteOpen(next);
    if (!next) {
      closeOverlays();
    }
  });

  const onSelectEntity = useCallbackRef(
    (payload: { id: string; kind: SceneEntityKind }) => {
      selectEntity(payload);
    }
  );

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
        selectionMode={selection.mode}
        autosaveLabel={autosaveLabel}
        onModeChange={setSceneMode}
        onToggleSelectionMode={toggleSelectionMode}
        onOpenCommandPalette={onOpenCommandPalette}
        onResetScene={resetScene}
      />
      <main className="flex min-h-[calc(100vh-8rem)] flex-col pt-8">
        <SceneWorkspace
          scene={scene}
          onBlankSpacePointerDown={onBlankSpacePointerDown}
          onQuickAdd={onQuickAdd}
          onSelectEntity={onSelectEntity}
        />
      </main>
      <SceneBottomBar
        scene={scene}
        activeTool={activeTool}
        onToolChange={setActiveTool}
      />
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
SceneWorkspace.displayName = "scene-workspace";
SceneBottomBar.displayName = "scene-bottom-bar";
PropertiesSidebar.displayName = "properties-sidebar";
SceneCommandPalette.displayName = "scene-command-palette";
