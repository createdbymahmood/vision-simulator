import { Circle, Layer, Line, Rect, Text } from "react-konva";
import type { ShapeKind, Vector2 } from "@/domains/scene/core/types";

interface DrawingOverlayProps {
  drawingWall: Vector2[];
  drawingShape: { kind: ShapeKind; start: Vector2; current: Vector2 } | null;
  hover: Vector2 | null;
  showMeasurements: boolean;
  toCanvas: (point: Vector2) => { x: number; y: number };
  wallPreview?: { start: Vector2; end: Vector2; thickness: number; color: string };
}

export function DrawingOverlay({ drawingWall, drawingShape, hover, showMeasurements, toCanvas, wallPreview }: DrawingOverlayProps) {
  return (
    <Layer listening={false}>
      {drawingWall.length ? (
        <Line
          points={drawingWall.flatMap((pt) => {
            const canvas = toCanvas(pt);
            return [canvas.x, canvas.y];
          })}
          stroke="#38bdf8"
          strokeWidth={2}
          dash={[8, 6]}
          lineCap="round"
          lineJoin="round"
        />
      ) : null}
      {wallPreview ? (
        <Line
          points={[
            toCanvas(wallPreview.start).x,
            toCanvas(wallPreview.start).y,
            toCanvas(wallPreview.end).x,
            toCanvas(wallPreview.end).y,
          ]}
          stroke={wallPreview.color}
          strokeWidth={wallPreview.thickness}
          opacity={0.55}
          lineCap="round"
          lineJoin="round"
        />
      ) : null}
      {drawingShape ? renderDrawingShape(drawingShape, toCanvas) : null}
      {showMeasurements && hover ? (
        <Text text={`x ${hover.x.toFixed(2)}m | y ${hover.y.toFixed(2)}m`} x={10} y={10} fill="#64748b" fontSize={12} fontFamily="Space Grotesk" />
      ) : null}
      {drawingWall.length && hover ? (
        <Text
          text={`len ${Math.hypot(
            hover.x - drawingWall[drawingWall.length - 1].x,
            hover.y - drawingWall[drawingWall.length - 1].y
          ).toFixed(2)}m • angle ${(
            (Math.atan2(hover.y - drawingWall[drawingWall.length - 1].y, hover.x - drawingWall[drawingWall.length - 1].x) * 180) / Math.PI
          ).toFixed(0)}°`}
          x={toCanvas(hover).x + 12}
          y={toCanvas(hover).y - 12}
          fill="#0ea5e9"
          fontSize={12}
          fontFamily="Space Grotesk"
        />
      ) : null}
    </Layer>
  );
}

function renderDrawingShape(
  drawing: { kind: ShapeKind; start: Vector2; current: Vector2 },
  toCanvas: (point: Vector2) => { x: number; y: number }
) {
  const start = toCanvas(drawing.start);
  const current = toCanvas(drawing.current);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);

  if (drawing.kind === "rectangle") {
    return <Rect x={x} y={y} width={width} height={height} stroke="#0ea5e9" dash={[6, 4]} strokeWidth={2} />;
  }
  if (drawing.kind === "circle") {
    const radius = Math.max(width, height) / 2;
    return (
      <Circle x={(start.x + current.x) / 2} y={(start.y + current.y) / 2} radius={radius} stroke="#0ea5e9" dash={[6, 4]} strokeWidth={2} />
    );
  }
  if (drawing.kind === "line") {
    return <Line points={[start.x, start.y, current.x, current.y]} stroke="#0ea5e9" dash={[6, 4]} strokeWidth={2} />;
  }
  if (drawing.kind === "triangle") {
    return <Line points={[start.x, start.y, current.x, current.y, start.x, current.y]} stroke="#0ea5e9" dash={[6, 4]} strokeWidth={2} />;
  }
  return null;
}
