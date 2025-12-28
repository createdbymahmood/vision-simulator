import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, LngLatLike, Map as MapLibreMap } from "maplibre-gl";
import type { Feature, FeatureCollection } from "geojson";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { pointInPolygon } from "../../core/geometry";
import type { SceneStore } from "../state/scene-store";
import { useSceneStore, getSceneStore } from "../state/scene-store";
import type { Vector2 } from "../../core/types";
import { PropertiesPanel } from "../shared/properties-panel";
import { Camera, MapPinned, SquarePlus, Search, Radio, Hand, Pointer, Shapes, PersonStanding, Map as MapIcon, Undo2, Redo2, PenLine } from "lucide-react";

const styles = {
  street: "https://demotiles.maplibre.org/style.json",
  dark: "https://demotiles.maplibre.org/style.json",
};

const cameraPresets = [
  { label: "Basic security", value: "basic" },
  { label: "Wide angle", value: "wide" },
  { label: "Telephoto", value: "telephoto" },
  { label: "Panoramic", value: "panoramic" },
  { label: "Indoor", value: "indoor" },
  { label: "Outdoor", value: "outdoor" },
];

function toGeoPoint(point: Vector2): [number, number] {
  return [point.x, point.y];
}

function areaToFeature(area: SceneStore["areas"][number]): Feature {
  return {
    type: "Feature",
    properties: { id: area.id, name: area.name, pointCount: area.pointCount },
    geometry: {
      type: "Polygon",
      coordinates: [[...area.geometry.points.map(toGeoPoint), toGeoPoint(area.geometry.points[0])]],
    },
  };
}

function wallToFeature(wall: SceneStore["walls"][number]): Feature {
  return {
    type: "Feature",
    properties: { id: wall.id, height: wall.height },
    geometry: {
      type: "LineString",
      coordinates: [toGeoPoint(wall.start), toGeoPoint(wall.end)],
    },
  };
}

function shapeToFeature(shape: SceneStore["shapes"][number]): Feature | null {
  if (shape.shape === "circle") {
    const points: [number, number][] = [];
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      points.push([shape.position.x + Math.cos(angle) * (shape.radius ?? 1), shape.position.y + Math.sin(angle) * (shape.radius ?? 1)]);
    }
    points.push(points[0]);
    return {
      type: "Feature",
      properties: { id: shape.id, shape: shape.shape },
      geometry: { type: "Polygon", coordinates: [points] },
    };
  }
  if (shape.shape === "rectangle") {
    const halfW = shape.width / 2;
    const halfL = shape.length / 2;
    const coords: [number, number][] = [
      [shape.position.x - halfW, shape.position.y - halfL],
      [shape.position.x + halfW, shape.position.y - halfL],
      [shape.position.x + halfW, shape.position.y + halfL],
      [shape.position.x - halfW, shape.position.y + halfL],
      [shape.position.x - halfW, shape.position.y - halfL],
    ];
    return { type: "Feature", properties: { id: shape.id, shape: shape.shape }, geometry: { type: "Polygon", coordinates: [coords] } };
  }
  return null;
}

function peopleCollection(people: SceneStore["people"]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: people.map((person) => ({
      type: "Feature",
      properties: { id: person.id },
      geometry: { type: "Point", coordinates: toGeoPoint(person.position) },
    })),
  };
}

function camerasCollection(cameras: SceneStore["cameras"]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: cameras.map((camera) => ({
      type: "Feature",
      properties: { id: camera.id, fov: camera.fov },
      geometry: { type: "Point", coordinates: toGeoPoint(camera.position) },
    })),
  };
}

export function MapEditor() {
  const mapRef = useRef<MapLibreMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const { push } = useToast();
  const state = useSceneStore((store) => store);
  const [styleId, setStyleId] = useState<keyof typeof styles>("street");
  const [areaDraft, setAreaDraft] = useState<Vector2[]>([]);
  const [wallDraft, setWallDraft] = useState<Vector2 | null>(null);
  const [devicePickerOpen, setDevicePickerOpen] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<string>("outdoor");
  const [handMode, setHandMode] = useState(false);

  const ensureMap = useCallbackRef(() => {
    if (mapRef.current || !mapContainerRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styles[styleId],
      center: [0, 0],
      zoom: 16,
      doubleClickZoom: false,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      installGeoLayers(map);
    });

    map.on("click", (event) => {
      const live = getSceneStore()?.getState();
      if (!live) return;
      if (handMode) return;
      if (live.selectionMode && live.activeTool === "select") {
        const hit = map.queryRenderedFeatures(event.point, { layers: ["people", "cameras", "walls-line", "shapes-fill", "areas-fill"] });
        const prioritized = hit.find((feature) => feature.layer.id === "people") ??
          hit.find((feature) => feature.layer.id === "cameras") ??
          hit.find((feature) => feature.layer.id === "walls-line") ??
          hit.find((feature) => feature.layer.id === "shapes-fill") ??
          hit.find((feature) => feature.layer.id === "areas-fill");
        if (prioritized?.properties?.id) {
          const id = String(prioritized.properties.id);
          if (prioritized.layer.id === "people") live.setSelection({ kind: "person", id });
          if (prioritized.layer.id === "cameras") live.setSelection({ kind: "camera", id });
          if (prioritized.layer.id === "walls-line") live.setSelection({ kind: "wall", id });
          if (prioritized.layer.id === "shapes-fill") live.setSelection({ kind: "shape", id });
          if (prioritized.layer.id === "areas-fill") live.setSelection({ kind: "area", id });
          return;
        }
      }
      const point = { x: event.lngLat.lng, y: event.lngLat.lat };
      if (live.activeTool === "area") {
        setAreaDraft((prev) => [...prev, point]);
        return;
      }
      if (live.activeTool === "wall") {
        if (!wallDraft) {
          setWallDraft(point);
        } else {
          if (!pointInsideAnyArea(point, live)) {
            push({ title: "Invalid placement", description: "Walls must stay inside an area." });
          } else {
            live.addWall(wallDraft, point);
          }
          setWallDraft(null);
        }
        return;
      }
      if (live.activeTool?.startsWith("shape")) {
        if (!pointInsideAnyArea(point, live)) {
          push({ title: "Invalid placement", description: "Shapes must stay inside an area." });
          return;
        }
        const kind = live.activeTool.replace("shape-", "") as any;
        live.addShape(kind, point, { width: 6, length: 6, opacity: 0.35 });
        return;
      }
      if (live.activeTool === "camera") {
        const area = pointInsideAnyArea(point, live);
        if (!area) {
          push({ title: "Invalid placement", description: "Cameras must be inside an area." });
          return;
        }
        live.addCamera(point, cameraPreset as any);
        return;
      }
      if (live.activeTool === "person") {
        const area = pointInsideAnyArea(point, live);
        if (!area) {
          push({ title: "Invalid placement", description: "People must be inside an area." });
          return;
        }
        live.addPerson(point, area.id);
        return;
      }
      if (live.selectionMode) {
        const selectedArea = live.areas.find((area) => pointInPolygon(point, area.geometry.points));
        if (selectedArea) live.setSelection({ kind: "area", id: selectedArea.id });
        else live.setSelection(null);
      }
    });

    map.on("dblclick", () => {
      if (areaDraft.length >= 3) {
        const name = `area-${state.areas.length + 1}`;
        getSceneStore()?.getState()?.addArea(name, areaDraft);
        setAreaDraft([]);
      }
    });
  });

  useEffect(() => {
    ensureMap();
  }, [ensureMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    map.setStyle(styles[styleId]);
    map.once("styledata", () => {
      installGeoLayers(map);
      const live = getSceneStore()?.getState() ?? state;
      syncSources(map, live, areaDraft);
    });
  }, [styleId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    syncSources(map, state, areaDraft);
  }, [state.areas, state.walls, state.shapes, state.people, state.cameras, areaDraft]);

  const onSearch = async (query: string) => {
    if (!query.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const json = await res.json();
      const first = json[0];
      if (first) {
        const center: LngLatLike = [parseFloat(first.lon), parseFloat(first.lat)];
        mapRef.current?.flyTo({ center, zoom: 16 });
      } else {
        push({ title: "Location not found", description: "Try a different query." });
      }
    } catch (error) {
      push({ title: "Search failed", description: "Network error while searching location." });
    }
  };

  const devicePicker = (
    <Popover
      trigger={
        <Button variant={state.activeTool === "camera" ? "default" : "ghost"} size="sm" className="gap-2">
          <Camera className="h-4 w-4" /> Device
        </Button>
      }
      open={devicePickerOpen}
      onOpenChange={setDevicePickerOpen}
      className="min-w-[260px]"
    >
      <Command>
        <CommandInput placeholder="Search devices..." />
        <CommandList>
          <CommandEmpty>No device</CommandEmpty>
          <CommandGroup heading="Cameras">
            {cameraPresets.map((preset) => (
              <CommandItem
                key={preset.value}
                value={preset.value}
                onSelect={(value) => {
                  setCameraPreset(value);
                  state.setActiveTool("camera");
                  setDevicePickerOpen(false);
                }}
              >
                {preset.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </Popover>
  );

  const activeAreaSummary = useMemo(
    () => `${state.areas.length} areas • ${state.cameras.length} cams • ${state.people.length} people`,
    [state.areas.length, state.cameras.length, state.people.length]
  );

  return (
    <div className="flex h-full gap-3">
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-2"><MapIcon className="h-4 w-4" /> Map editor</Badge>
            <p className="text-sm text-muted-foreground">{activeAreaSummary}</p>
            <div className="flex items-center gap-2">
              <Hand className="h-4 w-4" />
              <Switch
                checked={handMode}
                onChange={(event) => {
                  setHandMode(event.target.checked);
                  state.setSelectionMode(!event.target.checked);
                  state.setActiveTool(event.target.checked ? "hand" : "select");
                }}
              />
              <span className="text-xs text-muted-foreground">Hand mode</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStyleId(styleId === "street" ? "dark" : "street")}>
              Map view
            </Button>
            <Button variant="secondary" size="sm" onClick={() => state.undo()}>
              <Undo2 className="mr-1 h-4 w-4" /> Undo
            </Button>
            <Button variant="secondary" size="sm" onClick={() => state.redo()}>
              <Redo2 className="mr-1 h-4 w-4" /> Redo
            </Button>
          </div>
        </div>

        <div className="relative min-h-[70vh] overflow-hidden rounded-3xl border border-border/70">
          <div ref={mapContainerRef} className="absolute inset-0" />

          <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-2">
            <Popover
              trigger={
                <Button variant="secondary" size="sm" className="pointer-events-auto gap-2">
                  <Search className="h-4 w-4" /> Search
                </Button>
              }
              className="pointer-events-auto w-72"
            >
              <Command>
                <CommandInput
                  placeholder="City or country"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onSearch((event.target as HTMLInputElement).value);
                    }
                  }}
                />
                <CommandList>
                  <CommandEmpty>Type to search</CommandEmpty>
                </CommandList>
              </Command>
            </Popover>

            <Popover
              trigger={
                <Button variant="secondary" size="sm" className="pointer-events-auto gap-2">
                  <MapPinned className="h-4 w-4" /> Areas
                </Button>
              }
              className="pointer-events-auto w-64"
            >
              <div className="space-y-2">
                {state.areas.map((area) => (
                  <button
                    key={area.id}
                    className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-left text-sm hover:border-primary"
                    onClick={() => {
                      const coords = area.geometry.points;
                      const xs = coords.map((p) => p.x);
                      const ys = coords.map((p) => p.y);
                      const bounds: [LngLatLike, LngLatLike] = [
                        [Math.min(...xs), Math.min(...ys)],
                        [Math.max(...xs), Math.max(...ys)],
                      ];
                      mapRef.current?.fitBounds(bounds, { padding: 40 });
                      state.setSelection({ kind: "area", id: area.id });
                    }}
                  >
                    <span>{area.name}</span>
                    <Badge variant="outline">{area.pointCount} pts</Badge>
                  </button>
                ))}
              </div>
            </Popover>

            <Popover
              trigger={
                <Button variant="secondary" size="sm" className="pointer-events-auto gap-2">
                  <Radio className="h-4 w-4" /> Devices
                </Button>
              }
              className="pointer-events-auto w-64"
            >
              <div className="space-y-2 text-sm text-muted-foreground">
                {state.cameras.map((camera) => (
                  <div key={camera.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                    <span>Cam {camera.typePreset}</span>
                    <Badge variant="outline">FOV {camera.fov}</Badge>
                  </div>
                ))}
              </div>
            </Popover>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center">
            <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/70 bg-card/90 px-3 py-2 shadow-lg">
              <Button
                variant={state.activeTool === "select" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  state.setActiveTool("select");
                  state.setSelectionMode(true);
                }}
              >
                <Pointer className="mr-1 h-4 w-4" /> Selector
              </Button>
              <Button
                variant={state.activeTool === "area" ? "default" : "ghost"}
                size="sm"
                onClick={() => state.setActiveTool("area")}
              >
                <SquarePlus className="mr-1 h-4 w-4" /> Area
              </Button>
              <Button
                variant={state.activeTool === "wall" ? "default" : "ghost"}
                size="sm"
                onClick={() => state.setActiveTool("wall")}
              >
                <PenLine className="mr-1 h-4 w-4" /> Wall
              </Button>
              <Popover
                trigger={
                  <Button variant={state.activeTool.startsWith("shape") ? "default" : "ghost"} size="sm">
                    <Shapes className="mr-1 h-4 w-4" /> Shape
                  </Button>
                }
                className="min-w-[200px]"
              >
                <div className="grid grid-cols-2 gap-2">
                  {["rectangle", "circle", "triangle", "line"].map((shape) => (
                    <Button
                      key={shape}
                      variant="secondary"
                      size="sm"
                      onClick={() => state.setActiveTool(`shape-${shape}` as any)}
                    >
                      {shape}
                    </Button>
                  ))}
                </div>
              </Popover>
              {devicePicker}
              <Button
                variant={state.activeTool === "person" ? "default" : "ghost"}
                size="sm"
                onClick={() => state.setActiveTool("person")}
              >
                <PersonStanding className="mr-1 h-4 w-4" /> Person
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PropertiesPanel selection={state.selected} />
    </div>
  );
}

function pointInsideAnyArea(point: Vector2, state: SceneStore) {
  return state.areas.find((area) => pointInPolygon(point, area.geometry.points)) ?? null;
}

function installGeoLayers(map: MapLibreMap) {
  const ensureSource = (id: string, data: any) => {
    if (!map.getSource(id)) {
      map.addSource(id, data);
    }
  };
  ensureSource("areas", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  ensureSource("walls", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  ensureSource("shapes", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  ensureSource("people", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  ensureSource("cameras", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  ensureSource("draft", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

  const layerIfMissing = (id: string, layer: any) => {
    if (!map.getLayer(id)) {
      map.addLayer(layer);
    }
  };

  layerIfMissing("areas-fill", { id: "areas-fill", type: "fill", source: "areas", paint: { "fill-color": "#38bdf8", "fill-opacity": 0.1 } });
  layerIfMissing("areas-outline", { id: "areas-outline", type: "line", source: "areas", paint: { "line-color": "#38bdf8", "line-width": 2 } });
  layerIfMissing("walls-line", { id: "walls-line", type: "line", source: "walls", paint: { "line-color": "#0f172a", "line-width": 3 } });
  layerIfMissing("shapes-fill", { id: "shapes-fill", type: "fill", source: "shapes", paint: { "fill-color": "#22c55e", "fill-opacity": 0.2 } });
  layerIfMissing("shapes-line", { id: "shapes-line", type: "line", source: "shapes", paint: { "line-color": "#22c55e", "line-width": 2 } });
  layerIfMissing("people", { id: "people", type: "circle", source: "people", paint: { "circle-radius": 6, "circle-color": "#22c55e" } });
  layerIfMissing("cameras", { id: "cameras", type: "circle", source: "cameras", paint: { "circle-radius": 6, "circle-color": "#0ea5e9" } });
  layerIfMissing("draft", { id: "draft", type: "line", source: "draft", paint: { "line-color": "#94a3b8", "line-dasharray": [2, 2], "line-width": 2 } });
}

function syncSources(map: MapLibreMap, state: SceneStore, areaDraft: Vector2[]) {
  const areas = map.getSource("areas") as GeoJSONSource | undefined;
  const walls = map.getSource("walls") as GeoJSONSource | undefined;
  const shapes = map.getSource("shapes") as GeoJSONSource | undefined;
  const people = map.getSource("people") as GeoJSONSource | undefined;
  const cameras = map.getSource("cameras") as GeoJSONSource | undefined;
  const draft = map.getSource("draft") as GeoJSONSource | undefined;

  areas?.setData({ type: "FeatureCollection", features: state.areas.map(areaToFeature) });
  walls?.setData({ type: "FeatureCollection", features: state.walls.map(wallToFeature) });
  shapes?.setData({ type: "FeatureCollection", features: state.shapes.map(shapeToFeature).filter(Boolean) as any });
  people?.setData(peopleCollection(state.people) as any);
  cameras?.setData(camerasCollection(state.cameras) as any);
  draft?.setData({
    type: "FeatureCollection",
    features: areaDraft.length
      ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: areaDraft.map(toGeoPoint) } }]
      : [],
  });
}
