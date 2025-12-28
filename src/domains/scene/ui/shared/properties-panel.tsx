import { useMemo } from "react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import type { BackgroundLayer, SelectionKind } from "../../core/types";
import { useSceneStore } from "../state/scene-store";
import { PropertiesHeader } from "./properties/components/properties-header";
import { WallProperties } from "./properties/components/wall-properties";
import { ShapeProperties } from "./properties/components/shape-properties";
import { CameraProperties } from "./properties/components/camera-properties";
import { PersonProperties } from "./properties/components/person-properties";
import { AreaProperties } from "./properties/components/area-properties";
import { BackgroundProperties } from "./properties/components/background-properties";
import { useDebouncedUpdater } from "./properties/hooks/use-debounced-updater";

interface PropertiesPanelProps {
  selection: SelectionKind | null;
}

export function PropertiesPanel({ selection }: PropertiesPanelProps) {
  const walls = useSceneStore((state) => state.walls);
  const shapes = useSceneStore((state) => state.shapes);
  const cameras = useSceneStore((state) => state.cameras);
  const people = useSceneStore((state) => state.people);
  const areas = useSceneStore((state) => state.areas);
  const background = useSceneStore((state) => state.background);

  const updateWall = useSceneStore((state) => state.updateWall);
  const updateShape = useSceneStore((state) => state.updateShape);
  const updateCamera = useSceneStore((state) => state.updateCamera);
  const updatePerson = useSceneStore((state) => state.updatePerson);
  const updateArea = useSceneStore((state) => state.updateArea);
  const setBackground = useSceneStore((state) => state.setBackground);

  const removeWall = useSceneStore((state) => state.removeWall);
  const removeShape = useSceneStore((state) => state.removeShape);
  const removeCamera = useSceneStore((state) => state.removeCamera);
  const removePerson = useSceneStore((state) => state.removePerson);
  const removeArea = useSceneStore((state) => state.removeArea);
  const setSelection = useSceneStore((state) => state.setSelection);

  const debouncedUpdateWall = useDebouncedUpdater(updateWall);
  const debouncedUpdateShape = useDebouncedUpdater(updateShape);
  const debouncedUpdateCamera = useDebouncedUpdater(updateCamera);
  const debouncedUpdatePerson = useDebouncedUpdater(updatePerson);
  const debouncedUpdateArea = useDebouncedUpdater(updateArea);

  const wall = useMemo(
    () =>
      selection?.kind === "wall"
        ? walls.find((item) => item.id === selection.id) ?? null
        : null,
    [selection, walls]
  );
  const shape = useMemo(
    () =>
      selection?.kind === "shape"
        ? shapes.find((item) => item.id === selection.id) ?? null
        : null,
    [selection, shapes]
  );
  const camera = useMemo(
    () =>
      selection?.kind === "camera"
        ? cameras.find((item) => item.id === selection.id) ?? null
        : null,
    [selection, cameras]
  );
  const person = useMemo(
    () =>
      selection?.kind === "person"
        ? people.find((item) => item.id === selection.id) ?? null
        : null,
    [selection, people]
  );
  const area = useMemo(
    () =>
      selection?.kind === "area"
        ? areas.find((item) => item.id === selection.id) ?? null
        : null,
    [selection, areas]
  );

  const selectionTitle = useMemo(() => {
    if (!selection) return "";
    if ("id" in selection) return `${selection.kind} ${selection.id}`;
    return selection.kind;
  }, [selection]);

  const selectionSubtitle = useMemo(() => {
    if (selection?.kind === "area" && area) return area.name;
    return undefined;
  }, [area, selection]);

  const onDelete = useCallbackRef(() => {
    if (!selection) return;
    if (selection.kind === "wall") removeWall(selection.id);
    if (selection.kind === "shape") removeShape(selection.id);
    if (selection.kind === "camera") removeCamera(selection.id);
    if (selection.kind === "person") removePerson(selection.id);
    if (selection.kind === "area") removeArea(selection.id);
    if (selection.kind === "background") setBackground(undefined);
    setSelection(null);
  });

  const onBackgroundChange = useCallbackRef(
    (patch: Partial<BackgroundLayer>) => {
      if (!background) return;
      setBackground({ ...background, ...patch });
    }
  );

  if (!selection) return null;

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-lg">
      <PropertiesHeader
        title={selectionTitle}
        subtitle={selectionSubtitle}
        onDelete={onDelete}
      />

      {wall ? (
        <WallProperties
          wall={wall}
          onChange={(patch) => debouncedUpdateWall(wall.id, patch)}
        />
      ) : null}
      {shape ? (
        <ShapeProperties
          shape={shape}
          onChange={(patch) => debouncedUpdateShape(shape.id, patch)}
        />
      ) : null}
      {camera ? (
        <CameraProperties
          camera={camera}
          onChange={(patch) => debouncedUpdateCamera(camera.id, patch)}
        />
      ) : null}
      {person ? (
        <PersonProperties
          person={person}
          onChange={(patch) => debouncedUpdatePerson(person.id, patch)}
        />
      ) : null}
      {area ? (
        <AreaProperties
          area={area}
          onChange={(patch) => debouncedUpdateArea(area.id, patch)}
        />
      ) : null}
      {selection.kind === "background" && background ? (
        <BackgroundProperties
          background={background}
          onChange={onBackgroundChange}
        />
      ) : null}
    </aside>
  );
}
