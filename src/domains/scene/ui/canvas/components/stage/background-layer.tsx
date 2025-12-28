import { Image as KonvaImage, Layer } from "react-konva";
import type { BackgroundLayer, Vector2 } from "@/domains/scene/core/types";

interface BackgroundLayerProps {
  background?: BackgroundLayer;
  image: HTMLImageElement | null;
  toCanvas: (point: Vector2) => { x: number; y: number };
  zoom: number;
  onSelect: () => void;
}

export function BackgroundLayer({ background, image, toCanvas, zoom, onSelect }: BackgroundLayerProps) {
  if (!background || !image) return null;
  const canvasPoint = toCanvas(background.position);
  return (
    <Layer listening={!background.locked}>
      <KonvaImage
        image={image}
        opacity={background.opacity}
        x={canvasPoint.x}
        y={canvasPoint.y}
        scaleX={background.scale * zoom}
        scaleY={background.scale * zoom}
        rotation={background.rotation}
        onClick={onSelect}
      />
    </Layer>
  );
}
