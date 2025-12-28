import type { Feature, FeatureCollection } from "geojson";
import type { AnyLayer, AnySourceData, GeoJSONSource, Map as MapBoxMap } from "mapbox-gl";
import { pointInPolygon } from "@/domains/scene/core/geometry";
import type { Vector2 } from "@/domains/scene/core/types";
import type { SceneStore } from "../state/scene-store";

const toGeoPoint = (point: Vector2): [number, number] => [point.x, point.y];

type Area = SceneStore["areas"][number];
type Wall = SceneStore["walls"][number];
type Shape = SceneStore["shapes"][number];
type Person = SceneStore["people"][number];
type CameraEntity = SceneStore["cameras"][number];

export function areaToFeature(area: Area): Feature {
  return {
    type: "Feature",
    properties: { id: area.id, name: area.name, pointCount: area.pointCount },
    geometry: {
      type: "Polygon",
      coordinates: [[...area.geometry.points.map(toGeoPoint), toGeoPoint(area.geometry.points[0])]],
    },
  };
}

export function wallToFeature(wall: Wall): Feature {
  return {
    type: "Feature",
    properties: { id: wall.id, height: wall.height },
    geometry: {
      type: "LineString",
      coordinates: [toGeoPoint(wall.start), toGeoPoint(wall.end)],
    },
  };
}

export function shapeToFeature(shape: Shape): Feature | null {
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

export function peopleCollection(people: Person[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: people.map((person) => ({
      type: "Feature",
      properties: { id: person.id },
      geometry: { type: "Point", coordinates: toGeoPoint(person.position) },
    })),
  };
}

export function camerasCollection(cameras: CameraEntity[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: cameras.map((camera) => ({
      type: "Feature",
      properties: { id: camera.id, fov: camera.fov },
      geometry: { type: "Point", coordinates: toGeoPoint(camera.position) },
    })),
  };
}

export function pointInsideAnyArea(point: Vector2, state: SceneStore) {
  return state.areas.find((area) => pointInPolygon(point, area.geometry.points)) ?? null;
}

export function installGeoLayers(map: MapBoxMap) {
  const ensureSource = (id: string, data: AnySourceData) => {
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

  const layerIfMissing = (id: string, layer: AnyLayer) => {
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

export function syncSources(map: MapBoxMap, state: SceneStore, areaDraft: Vector2[]) {
  const areas = map.getSource("areas") as GeoJSONSource | undefined;
  const walls = map.getSource("walls") as GeoJSONSource | undefined;
  const shapes = map.getSource("shapes") as GeoJSONSource | undefined;
  const people = map.getSource("people") as GeoJSONSource | undefined;
  const cameras = map.getSource("cameras") as GeoJSONSource | undefined;
  const draft = map.getSource("draft") as GeoJSONSource | undefined;

  areas?.setData({ type: "FeatureCollection", features: state.areas.map(areaToFeature) });
  walls?.setData({ type: "FeatureCollection", features: state.walls.map(wallToFeature) });
  const shapeFeatures = state.shapes.map(shapeToFeature).filter(isFeature);
  shapes?.setData({ type: "FeatureCollection", features: shapeFeatures });
  people?.setData(peopleCollection(state.people));
  cameras?.setData(camerasCollection(state.cameras));
  const draftLine: Feature | null = areaDraft.length
    ? {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: areaDraft.map(toGeoPoint) },
      }
    : null;
  draft?.setData({
    type: "FeatureCollection",
    features: draftLine ? [draftLine] : [],
  });
}

function isFeature(feature: Feature | null): feature is Feature {
  return Boolean(feature);
}
