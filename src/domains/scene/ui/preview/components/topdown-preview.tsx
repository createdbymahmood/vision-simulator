import type { CameraEntity, PersonEntity, ShapeEntity, Vector2, WallSegment } from "@/domains/scene/core/types";

interface TopDownPreviewProps {
  walls: WallSegment[];
  shapes: ShapeEntity[];
  cameras: CameraEntity[];
  people: PersonEntity[];
  selectedId: string | null;
  onPersonSelect?: (id: string) => void;
}

export function TopDownPreview({ walls, shapes, cameras, people, selectedId, onPersonSelect }: TopDownPreviewProps) {
  const width = 480;
  const height = 320;
  const toCanvas = (point: Vector2) => ({ x: width / 2 + point.x * 12, y: height / 2 + point.y * 12 });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={width} height={height} fill="url(#grid)" />
      {walls.map((wall) => {
        const s = toCanvas(wall.start);
        const e = toCanvas(wall.end);
        return <line key={wall.id} x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#0f172a" strokeWidth={wall.thickness * 8} />;
      })}
      {shapes.map((shape) => {
        const pos = toCanvas(shape.position);
        if (shape.shape === "circle") {
          return <circle key={shape.id} cx={pos.x} cy={pos.y} r={(shape.radius ?? 1) * 12} fill="#22c55e20" stroke="#22c55e" />;
        }
        if (shape.shape === "rectangle") {
          return (
            <rect
              key={shape.id}
              x={pos.x - (shape.width * 12) / 2}
              y={pos.y - (shape.length * 12) / 2}
              width={shape.width * 12}
              height={shape.length * 12}
              fill="#22c55e20"
              stroke="#22c55e"
            />
          );
        }
        return null;
      })}
      {cameras.map((camera) => {
        const pos = toCanvas(camera.position);
        const coneEnd = toCanvas({ x: camera.position.x + Math.cos((camera.direction * Math.PI) / 180) * camera.depth, y: camera.position.y + Math.sin((camera.direction * Math.PI) / 180) * camera.depth });
        return (
          <g key={camera.id}>
            <circle cx={pos.x} cy={pos.y} r={8} fill="#0ea5e9" />
            <line x1={pos.x} y1={pos.y} x2={coneEnd.x} y2={coneEnd.y} stroke="#0ea5e9" strokeWidth={1} />
          </g>
        );
      })}
      {selectedId
        ? people
            .find((person) => person.id === selectedId)
            ?.trail?.map((point, idx, arr) => {
              if (idx === arr.length - 1) return null;
              const a = toCanvas(point);
              const b = toCanvas(arr[idx + 1]);
              return <line key={`${selectedId}-trail-${idx}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#22c55e" strokeWidth={2} opacity={0.6} />;
            })
        : null}
      {people.map((person) => {
        const pos = toCanvas(person.position);
        return (
          <circle
            key={person.id}
            cx={pos.x}
            cy={pos.y}
            r={person.radius * 12}
            fill={selectedId === person.id ? "#22c55e" : "#0ea5e9"}
            opacity={0.8}
            onClick={() => onPersonSelect?.(person.id)}
            style={{ cursor: onPersonSelect ? "pointer" : "default" }}
          />
        );
      })}
    </svg>
  );
}
