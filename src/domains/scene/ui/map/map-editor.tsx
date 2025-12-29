import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { Camera } from "lucide-react";
import Map from "react-map-gl/mapbox";
import type { MapRef, MapEvent } from "react-map-gl/mapbox";
import {
  type LngLatBoundsLike,
  type LngLatLike,
  type MapLayerMouseEvent,
  type MapboxGeoJSONFeature,
  type Map as MapBoxInstance,
} from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { PropertiesPanel } from "../shared/properties-panel";
import { useSceneStore } from "../state/scene-store";
import type { CameraPreset, ShapeKind, Vector2 } from "../../core/types";
import { MapToolbar } from "./components/map-toolbar";
import { MapOverlays } from "./components/map-overlays";
import { MapBottomNav } from "./components/map-bottom-nav";
import { installGeoLayers, pointInsideAnyArea, syncSources } from "./map-geo";

const styles = {
  street: "mapbox://styles/mapbox/streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
};

const cameraPresets: { label: string; value: CameraPreset }[] = [
  { label: "Basic security", value: "basic" },
  { label: "Wide angle", value: "wide" },
  { label: "Telephoto", value: "telephoto" },
  { label: "Panoramic", value: "panoramic" },
  { label: "Indoor", value: "indoor" },
  { label: "Outdoor", value: "outdoor" },
];

export function MapEditor() {
  const { push } = useToast();
  const state = useSceneStore((store) => store);
  const [areaDraft, setAreaDraft] = useState<Vector2[]>([]);
  const [wallDraft, setWallDraft] = useState<Vector2 | null>(null);
  const [devicePickerOpen, setDevicePickerOpen] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("outdoor");
  const [handMode, setHandMode] = useState(false);
  const [mapStyle, setMapStyle] = useState<keyof typeof styles>("street");
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapRef | null>(null);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  useEffect(() => {
    if (!mapboxToken) {
      push({
        title: "Mapbox token missing",
        description: "Set VITE_MAPBOX_TOKEN to render the map.",
      });
    }
  }, [mapboxToken, push]);

  const onSearch = useCallbackRef(async (query: string) => {
    if (!query.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=1`
      );
      const json = await res.json();
      const first = json[0];
      if (first) {
        const center: LngLatLike = [
          parseFloat(first.lon),
          parseFloat(first.lat),
        ];
        mapRef.current?.flyTo({ center, zoom: 16 });
      } else {
        push({
          title: "Location not found",
          description: "Try a different query.",
        });
      }
    } catch {
      push({
        title: "Search failed",
        description: "Network error while searching location.",
      });
    }
  });

  const activeAreaSummary = useMemo(
    () =>
      `${state.areas.length} areas • ${state.cameras.length} cams • ${state.people.length} people`,
    [state.areas.length, state.cameras.length, state.people.length]
  );

  const flyToArea = useCallbackRef((areaId: string) => {
    const area = state.areas.find((a) => a.id === areaId);
    if (!area) return;
    const coords = area.geometry.points;
    const xs = coords.map((p) => p.x);
    const ys = coords.map((p) => p.y);
    const bounds: [LngLatLike, LngLatLike] = [
      [Math.min(...xs), Math.min(...ys)],
      [Math.max(...xs), Math.max(...ys)],
    ];
    mapRef.current
      ?.getMap()
      .fitBounds(bounds as LngLatBoundsLike, { padding: 40 });
    state.setSelection({ kind: "area", id: area.id });
  });

  const installLayers = useCallbackRef((map: MapBoxInstance) => {
    installGeoLayers(map);
    syncSources(map, state, areaDraft);
    setMapReady(true);
  });

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !mapReady || !map.isStyleLoaded()) return;
    syncSources(map, state, areaDraft);
  }, [areaDraft, mapReady, state]);

  const handleMapClick = useCallbackRef((event: MapLayerMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const live = state;
    if (handMode) return;
    if (live.selectionMode && live.activeTool === "select") {
      const hit = map.queryRenderedFeatures(event.point, {
        layers: [
          "people",
          "cameras",
          "walls-line",
          "shapes-fill",
          "areas-fill",
        ],
      }) as MapboxGeoJSONFeature[];
      const prioritized =
        hit.find((feature) => feature.layer?.id === "people") ??
        hit.find((feature) => feature.layer?.id === "cameras") ??
        hit.find((feature) => feature.layer?.id === "walls-line") ??
        hit.find((feature) => feature.layer?.id === "shapes-fill") ??
        hit.find((feature) => feature.layer?.id === "areas-fill");
      if (prioritized?.properties?.id && prioritized.layer?.id) {
        const id = String(prioritized.properties.id);
        if (prioritized.layer?.id === "people")
          live.setSelection({ kind: "person", id });
        if (prioritized.layer?.id === "cameras")
          live.setSelection({ kind: "camera", id });
        if (prioritized.layer?.id === "walls-line")
          live.setSelection({ kind: "wall", id });
        if (prioritized.layer?.id === "shapes-fill")
          live.setSelection({ kind: "shape", id });
        if (prioritized.layer?.id === "areas-fill")
          live.setSelection({ kind: "area", id });
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
          push({
            title: "Invalid placement",
            description: "Walls must stay inside an area.",
          });
        } else {
          live.addWall(wallDraft, point);
        }
        setWallDraft(null);
      }
      return;
    }
    if (live.activeTool?.startsWith("shape")) {
      if (!pointInsideAnyArea(point, live)) {
        push({
          title: "Invalid placement",
          description: "Shapes must stay inside an area.",
        });
        return;
      }
      const kind = live.activeTool.replace("shape-", "") as ShapeKind;
      live.addShape(kind, point, { width: 6, length: 6, opacity: 0.35 });
      return;
    }
    if (live.activeTool === "camera") {
      const area = pointInsideAnyArea(point, live);
      if (!area) {
        push({
          title: "Invalid placement",
          description: "Cameras must be inside an area.",
        });
        return;
      }
      live.addCamera(point, cameraPreset);
      return;
    }
    if (live.activeTool === "person") {
      const area = pointInsideAnyArea(point, live);
      if (!area) {
        push({
          title: "Invalid placement",
          description: "People must be inside an area.",
        });
        return;
      }
      live.addPerson(point, area.id);
      return;
    }
    if (live.selectionMode) {
      const selectedArea = pointInsideAnyArea(point, live);
      if (selectedArea)
        live.setSelection({ kind: "area", id: selectedArea.id });
      else live.setSelection(null);
    }
  });

  const handleDblClick = useCallbackRef(() => {
    if (areaDraft.length >= 3) {
      const name = `area-${state.areas.length + 1}`;
      state.addArea(name, areaDraft);
      setAreaDraft([]);
    }
  });

  const devicePicker = (
    <Popover open={devicePickerOpen} onOpenChange={setDevicePickerOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            state.activeTool === "camera"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card"
          }`}
          onClick={() => {
            state.setActiveTool("camera");
            setDevicePickerOpen(true);
          }}
        >
          <Camera className="h-4 w-4" /> Device
        </button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[260px] p-0">
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
                    setCameraPreset(value as CameraPreset);
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
      </PopoverContent>
    </Popover>
  );

  const defaultLat = 37.769;
  const defaultLong = -122.418;
  return (
    <div className="flex h-full gap-3">
      <div className="flex w-full flex-col gap-3">
        <MapToolbar
          summary={activeAreaSummary}
          handMode={handMode}
          onHandToggle={(on) => {
            setHandMode(on);
            state.setSelectionMode(!on);
            state.setActiveTool(on ? "hand" : "select");
          }}
          onToggleStyle={() => {
            setMapReady(false);
            setMapStyle(mapStyle === "street" ? "dark" : "street");
          }}
          onUndo={state.undo}
          onRedo={state.redo}
        />

        <div className="relative min-h-[70vh] overflow-hidden rounded-3xl border border-border/70">
          <Map
            ref={mapRef}
            /* place somwherein LA  */
            initialViewState={{
              longitude: defaultLong,
              latitude: defaultLat,
              zoom: 12,
            }}
            minZoom={5}
            mapboxAccessToken={mapboxToken}
            style={{ width: "100%", height: "100%" }}
            mapStyle={styles[mapStyle]}
            onLoad={(event: MapEvent) =>
              installLayers(event.target as MapBoxInstance)
            }
            onStyleData={() => {
              const map = mapRef.current?.getMap();
              if (map) installLayers(map);
            }}
            onClick={handleMapClick}
            onDblClick={handleDblClick}
            dragPan={!handMode}
            dragRotate={!handMode}
            scrollZoom
            doubleClickZoom={false}
            interactiveLayerIds={[
              "people",
              "cameras",
              "walls-line",
              "shapes-fill",
              "areas-fill",
            ]}
          />
          <MapOverlays
            areas={state.areas}
            cameras={state.cameras}
            onSearch={onSearch}
            onAreaFlyTo={flyToArea}
          />
          <MapBottomNav
            activeTool={state.activeTool}
            onSelectTool={(tool) => state.setActiveTool(tool)}
            devicePicker={devicePicker}
          />
        </div>
      </div>

      <PropertiesPanel selection={state.selected} />
    </div>
  );
}
