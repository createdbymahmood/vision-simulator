import type { CameraEntity } from "@/domains/scene/core/types";
import { MonitorSmartphone } from "lucide-react";

interface CctvFeedsProps {
  cameras: CameraEntity[];
}

export function CctvFeeds({ cameras }: CctvFeedsProps) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">CCTV feeds</p>
        <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-2 gap-2 overflow-y-auto">
        {cameras.map((camera) => (
          <div key={camera.id} className="relative aspect-video rounded-xl border border-border/60 bg-gradient-to-br from-slate-900 to-slate-800 p-2">
            <p className="text-xs text-muted-foreground">{`Cam ${camera.typePreset}`}</p>
            <div className="absolute inset-2 rounded-lg border border-white/10 bg-black/30" />
            <div className="absolute inset-2">
              {camera.detections
                ?.filter((d) => d.visible && d.boundingBox)
                .map((detection) => {
                  const box = detection.boundingBox!;
                  const { width, height } = camera.resolution;
                  return (
                    <div
                      key={detection.personId}
                      className="absolute border border-emerald-400/80 bg-emerald-500/10"
                      style={{
                        left: `${(box.x / width) * 100}%`,
                        top: `${(box.y / height) * 100}%`,
                        width: `${(box.width / width) * 100}%`,
                        height: `${(box.height / height) * 100}%`,
                      }}
                    />
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
