import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Hand, Map as MapIcon, Undo2, Redo2 } from "lucide-react";

interface MapToolbarProps {
  summary: string;
  handMode: boolean;
  onHandToggle: (on: boolean) => void;
  onToggleStyle?: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function MapToolbar({ summary, handMode, onHandToggle, onUndo, onRedo, onToggleStyle }: MapToolbarProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="gap-2">
          <MapIcon className="h-4 w-4" /> Map editor
        </Badge>
        <p className="text-sm text-muted-foreground">{summary}</p>
        <div className="flex items-center gap-2">
          <Hand className="h-4 w-4" />
          <Switch checked={handMode} onCheckedChange={(checked) => onHandToggle(checked)} />
          <span className="text-xs text-muted-foreground">Hand mode</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onToggleStyle ? (
          <Button variant="ghost" size="sm" onClick={onToggleStyle}>
            Map view
          </Button>
        ) : null}
        <Button variant="secondary" size="sm" onClick={onUndo}>
          <Undo2 className="mr-1 h-4 w-4" /> Undo
        </Button>
        <Button variant="secondary" size="sm" onClick={onRedo}>
          <Redo2 className="mr-1 h-4 w-4" /> Redo
        </Button>
      </div>
    </div>
  );
}
