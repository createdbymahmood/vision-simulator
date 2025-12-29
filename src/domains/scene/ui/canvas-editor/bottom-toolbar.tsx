import {
  ArrowLeftRightIcon,
  CameraIcon,
  MousePointer2Icon,
  ShapesIcon,
  TriangleIcon,
  UserRoundIcon,
  WallpaperIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SceneTool } from "../../core/scene-types";

export function CanvasBottomToolbar({
  activeTool,
  activeShapeLabel,
  selectionMode,
  onToggleSelectionMode,
  onToolChange,
  onShapeSelect,
  onBackgroundClick,
  wallCount,
  shapeCount,
}: {
  activeTool: SceneTool;
  activeShapeLabel: string;
  selectionMode: "single" | "multi";
  onToggleSelectionMode: () => void;
  onToolChange: (tool: SceneTool) => void;
  onShapeSelect: (shape: "rectangle" | "circle" | "triangle" | "line") => void;
  onBackgroundClick: () => void;
  wallCount: number;
  shapeCount: number;
}) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
      <div className="flex w-full max-w-5xl items-center gap-4 rounded-full border bg-background/95 px-4 py-3 shadow-md backdrop-blur">
        <div className="flex items-center gap-2">
          <Switch
            checked={selectionMode === "multi"}
            onCheckedChange={() => onToggleSelectionMode()}
            id="selection-mode"
          />
          <label htmlFor="selection-mode" className="text-sm">
            Selection mode
          </label>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <ToggleGroup
          type="single"
          value={activeTool}
          onValueChange={(value) => {
            if (!value) return;
            onToolChange(value as SceneTool);
          }}
          spacing={4}
        >
          <ToggleGroupItem value="select" aria-label="Select tool">
            <MousePointer2Icon className="size-4" />
            Select
          </ToggleGroupItem>
          <ToggleGroupItem value="wall" aria-label="Draw wall tool">
            <ArrowLeftRightIcon className="size-4" />
            Wall
          </ToggleGroupItem>
          <Popover>
            <PopoverTrigger asChild>
              <ToggleGroupItem value="shape" aria-label="Draw shapes">
                <ShapesIcon className="size-4" />
                {activeShapeLabel}
              </ToggleGroupItem>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="flex flex-col gap-2">
                <Button
                  variant={activeShapeLabel === "Rectangle" ? "default" : "outline"}
                  onClick={() => onShapeSelect("rectangle")}
                  size="sm"
                >
                  <MousePointer2Icon className="mr-2 size-4" />
                  Rectangle
                </Button>
                <Button
                  variant={activeShapeLabel === "Circle" ? "default" : "outline"}
                  onClick={() => onShapeSelect("circle")}
                  size="sm"
                >
                  <ShapesIcon className="mr-2 size-4" />
                  Circle
                </Button>
                <Button
                  variant={activeShapeLabel === "Triangle" ? "default" : "outline"}
                  onClick={() => onShapeSelect("triangle")}
                  size="sm"
                >
                  <TriangleIcon className="mr-2 size-4" />
                  Triangle
                </Button>
                <Button
                  variant={activeShapeLabel === "Line" ? "default" : "outline"}
                  onClick={() => onShapeSelect("line")}
                  size="sm"
                >
                  <ArrowLeftRightIcon className="mr-2 size-4" />
                  Line
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <ToggleGroupItem value="camera" aria-label="Place camera">
            <CameraIcon className="size-4" />
            Camera
          </ToggleGroupItem>
          <ToggleGroupItem value="person" aria-label="Place person">
            <UserRoundIcon className="size-4" />
            Person
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          variant="secondary"
          size="sm"
          onClick={onBackgroundClick}
          className="rounded-full"
        >
          <WallpaperIcon className="mr-2 size-4" />
          Add background
        </Button>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Badge variant="outline">{activeShapeLabel}</Badge>
          <Badge variant="secondary">Walls {wallCount}</Badge>
          <Badge variant="secondary">Shapes {shapeCount}</Badge>
        </div>
      </div>
    </div>
  );
}
