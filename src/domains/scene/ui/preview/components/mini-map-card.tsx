import type { CameraEntity, PersonEntity, ShapeEntity, WallSegment } from "@/domains/scene/core/types";
import { TopDownPreview } from "./topdown-preview";

interface MiniMapCardProps {
  walls: WallSegment[];
  shapes: ShapeEntity[];
  cameras: CameraEntity[];
  people: PersonEntity[];
  selectedId: string | null;
  onPersonSelect: (id: string) => void;
}

export function MiniMapCard({ walls, shapes, cameras, people, selectedId, onPersonSelect }: MiniMapCardProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Mini map</p>
      <div className="mt-2 h-48 overflow-hidden rounded-xl border border-border/70 bg-muted/40">
        <TopDownPreview walls={walls} shapes={shapes} cameras={cameras} people={people} selectedId={selectedId} onPersonSelect={onPersonSelect} />
      </div>
    </div>
  );
}
