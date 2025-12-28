import { Layer, Line } from "react-konva";
import { GRID_MAJOR, GRID_MINOR, PX_PER_METER } from "./stage-constants";

interface GridLayerProps {
  width: number;
  height: number;
  offset: { x: number; y: number };
  zoom: number;
}

export function GridLayer({ width, height, offset, zoom }: GridLayerProps) {
  const lines = [];
  const spacingMinor = PX_PER_METER * GRID_MINOR * zoom;
  const spacingMajor = PX_PER_METER * GRID_MAJOR * zoom;

  for (let x = offset.x % spacingMinor; x < width; x += spacingMinor) {
    lines.push(<Line key={`v-${x}`} points={[x, 0, x, height]} stroke="#e2e8f0" strokeWidth={0.5} opacity={0.45} />);
  }
  for (let y = offset.y % spacingMinor; y < height; y += spacingMinor) {
    lines.push(<Line key={`h-${y}`} points={[0, y, width, y]} stroke="#e2e8f0" strokeWidth={0.5} opacity={0.45} />);
  }
  for (let x = offset.x % spacingMajor; x < width; x += spacingMajor) {
    lines.push(<Line key={`vm-${x}`} points={[x, 0, x, height]} stroke="#94a3b8" strokeWidth={1} opacity={0.45} />);
  }
  for (let y = offset.y % spacingMajor; y < height; y += spacingMajor) {
    lines.push(<Line key={`hm-${y}`} points={[0, y, width, y]} stroke="#94a3b8" strokeWidth={1} opacity={0.45} />);
  }

  return <Layer listening={false}>{lines}</Layer>;
}
