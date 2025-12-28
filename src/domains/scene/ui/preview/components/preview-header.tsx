import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Camera, CirclePlay, Square } from "lucide-react";

interface PreviewHeaderProps {
  playing: boolean;
  onTogglePlay: () => void;
  previewMode: "3d" | "2d";
  onPreviewMode: (mode: "3d" | "2d") => void;
  onSnapshot: () => void;
  recording: boolean;
  onToggleRecording: () => void;
  areas: { id: string; name: string }[];
  onAreaFocus?: (id: string) => void;
  mapVisible: boolean;
  onToggleMapVisible?: (on: boolean) => void;
}

export function PreviewHeader({
  playing,
  onTogglePlay,
  previewMode,
  onPreviewMode,
  onSnapshot,
  recording,
  onToggleRecording,
  areas,
  onAreaFocus,
  mapVisible,
  onToggleMapVisible,
}: PreviewHeaderProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Badge variant="secondary">Simulation</Badge>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={playing} onCheckedChange={onTogglePlay} /> {playing ? "Playing" : "Paused"}
        </div>
        <div className="flex items-center gap-2">
          <Button variant={previewMode === "3d" ? "default" : "ghost"} size="sm" onClick={() => onPreviewMode("3d")}>
            3D
          </Button>
          <Button variant={previewMode === "2d" ? "default" : "ghost"} size="sm" onClick={() => onPreviewMode("2d")}>
            2D
          </Button>
        </div>
        {areas.length ? (
          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs"
              defaultValue=""
              onChange={(event) => onAreaFocus?.(event.target.value)}
            >
              <option value="">Area focus</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Switch checked={mapVisible} onCheckedChange={(checked) => onToggleMapVisible?.(checked)} /> Map view
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onSnapshot}>
          <Camera className="mr-1 h-4 w-4" /> Snapshot
        </Button>
        <Button variant="secondary" size="sm" onClick={onToggleRecording}>
          {recording ? <Square className="mr-1 h-4 w-4" /> : <CirclePlay className="mr-1 h-4 w-4" />} {recording ? "Stop" : "Record"}
        </Button>
      </div>
    </div>
  );
}
