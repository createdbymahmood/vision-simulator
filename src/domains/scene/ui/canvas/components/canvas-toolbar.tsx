import { Pointer, Grid, Undo2, Redo2, Trash2, Play, Wand2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { GridSettings } from "@/domains/scene/core/types";

interface CanvasToolbarProps {
  selectionMode: boolean;
  grid: GridSettings;
  onToggleSelection: () => void;
  onGridChange: (grid: Partial<GridSettings>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onPreview: () => void;
  onExportTopDown: () => void;
  onExportJson: () => void;
}

export function CanvasToolbar({
  selectionMode,
  grid,
  onToggleSelection,
  onGridChange,
  onUndo,
  onRedo,
  onClear,
  onPreview,
  onExportTopDown,
  onExportJson,
}: CanvasToolbarProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Badge variant={selectionMode ? "default" : "outline"}>Selection {selectionMode ? "On" : "Off"}</Badge>
        <Button variant="ghost" size="icon" onClick={onToggleSelection} aria-label="Toggle selection mode">
          <Pointer className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <Grid className="h-4 w-4" />
          <span>Snap</span>
          <Switch checked={grid.snapToGrid} onCheckedChange={(checked) => onGridChange({ snapToGrid: checked })} />
          <span>Measure</span>
          <Switch checked={grid.measurementOverlay} onCheckedChange={(checked) => onGridChange({ measurementOverlay: checked })} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onUndo} aria-label="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRedo} aria-label="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear board">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onExportTopDown} aria-label="Export top-down">
          <Wand2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="gap-2" onClick={onExportJson}>
          <Save className="h-4 w-4" /> Export JSON
        </Button>
        <Button variant="secondary" className="gap-2" onClick={onPreview}>
          <Play className="h-4 w-4" /> Live Preview
        </Button>
      </div>
    </div>
  );
}
