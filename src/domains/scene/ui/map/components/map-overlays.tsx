import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPinned, Search, Radio } from "lucide-react";
import type { SceneStore } from "../../state/scene-store";

interface MapOverlaysProps {
  areas: SceneStore["areas"];
  cameras: SceneStore["cameras"];
  onSearch: (query: string) => void;
  onAreaFlyTo: (areaId: string) => void;
}

export function MapOverlays({ areas, cameras, onSearch, onAreaFlyTo }: MapOverlaysProps) {
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm" className="pointer-events-auto gap-2">
            <Search className="h-4 w-4" /> Search
          </Button>
        </PopoverTrigger>
        <PopoverContent className="pointer-events-auto w-72 p-0">
          <Command>
            <CommandInput
              placeholder="City or country"
              onKeyDown={(event) => {
                if (event.key === "Enter") onSearch((event.target as HTMLInputElement).value);
              }}
            />
            <CommandList>
              <CommandEmpty>Type to search</CommandEmpty>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm" className="pointer-events-auto gap-2">
            <MapPinned className="h-4 w-4" /> Areas
          </Button>
        </PopoverTrigger>
        <PopoverContent className="pointer-events-auto w-64">
          <div className="space-y-2">
            {areas.map((area) => (
              <button
                key={area.id}
                className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-left text-sm hover:border-primary"
                onClick={() => onAreaFlyTo(area.id)}
              >
                <span>{area.name}</span>
                <Badge variant="outline">{area.pointCount} pts</Badge>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm" className="pointer-events-auto gap-2">
            <Radio className="h-4 w-4" /> Devices
          </Button>
        </PopoverTrigger>
        <PopoverContent className="pointer-events-auto w-64">
          <div className="space-y-2 text-sm text-muted-foreground">
            {cameras.map((camera) => (
              <div key={camera.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <span>Cam {camera.typePreset}</span>
                <Badge variant="outline">FOV {camera.fov}</Badge>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
