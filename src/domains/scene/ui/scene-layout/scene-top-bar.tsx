import { MapIcon, SquareStackIcon, VideoIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SceneMode } from "../../core/scene-types";

interface SceneTopBarProps {
  mode: SceneMode;
  autosaveLabel: string;
  onModeChange: (mode: SceneMode) => void;
  onOpenCommandPalette: () => void;
  onResetScene: () => void;
}

export function SceneTopBar({
  mode,
  autosaveLabel,
  onModeChange,
  onOpenCommandPalette,
  onResetScene,
}: SceneTopBarProps) {
  return (
    <div className="fixed left-0 right-0 top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Computer Vision Simulator</Badge>
          <Badge>Phase 2 — Canvas</Badge>
          <span className="text-muted-foreground text-xs">{autosaveLabel}</span>
        </div>
        <div className="flex h-6 items-center">
          <Separator orientation="vertical" />
        </div>
        <Tabs value={mode} onValueChange={(value) => onModeChange(value as SceneMode)}>
          <TabsList>
            <TabsTrigger value="canvas">
              <SquareStackIcon className="mr-2 size-4" />
              Canvas
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapIcon className="mr-2 size-4" />
              Map
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex h-6 items-center">
          <Separator orientation="vertical" />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={onOpenCommandPalette}>
              <VideoIcon className="mr-2 size-4" />
              Command / Overlays
            </Button>
          </TooltipTrigger>
          <TooltipContent>Opens the global command palette.</TooltipContent>
        </Tooltip>
        <Button variant="ghost" onClick={onResetScene}>
          Reset scene
        </Button>
      </div>
    </div>
  );
}

SceneTopBar.displayName = "scene-top-bar";
