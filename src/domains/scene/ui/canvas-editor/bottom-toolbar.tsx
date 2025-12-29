import {
  ArrowLeftRightIcon,
  CameraIcon,
  Circle,
  LineSquiggle,
  MousePointer2Icon,
  RectangleCircle,
  ShapesIcon,
  TriangleIcon,
  UserRoundIcon,
  WallpaperIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SceneTool } from "../../core/scene-types";

export function CanvasBottomToolbar({
  activeTool,
  activeShapeLabel,
  onToolChange,
  onShapeSelect,
  onBackgroundClick,
}: {
  activeTool: SceneTool;
  activeShapeLabel: string;
  onToolChange: (tool: SceneTool) => void;
  onShapeSelect: (shape: "rectangle" | "circle" | "triangle" | "line") => void;
  onBackgroundClick: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
      <div className="flex w-full max-w-fit items-center gap-4 rounded-full border bg-background/95 px-4 py-3 shadow-md backdrop-blur justify-center">
        <div className="flex flex-row gap-2 items-center">
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
              <MousePointer2Icon className="size-5" />
            </ToggleGroupItem>

            <ToggleGroupItem value="wall" aria-label="Draw wall tool">
              <ArrowLeftRightIcon className="size-5" />
            </ToggleGroupItem>
            <Popover>
              <PopoverTrigger asChild>
                <ToggleGroupItem value="shape" aria-label="Draw shapes">
                  <ShapesIcon className="size-5" />
                  {/* {activeShapeLabel} */}
                </ToggleGroupItem>
              </PopoverTrigger>
              <PopoverContent className="w-fit">
                <div className="flex flex-col gap-2">
                  <Button
                    variant={
                      activeShapeLabel === "Rectangle" ? "default" : "outline"
                    }
                    onClick={() => onShapeSelect("rectangle")}
                    size="icon"
                  >
                    <RectangleCircle className="size-5" />
                    {/* Rectangle */}
                  </Button>
                  <Button
                    variant={
                      activeShapeLabel === "Circle" ? "default" : "outline"
                    }
                    onClick={() => onShapeSelect("circle")}
                    size="icon"
                  >
                    <Circle className="size-5" />
                    {/* Circle */}
                  </Button>
                  <Button
                    variant={
                      activeShapeLabel === "Triangle" ? "default" : "outline"
                    }
                    onClick={() => onShapeSelect("triangle")}
                    size="icon"
                  >
                    <TriangleIcon className="size-5" />
                    {/* Triangle */}
                  </Button>
                  <Button
                    variant={
                      activeShapeLabel === "Line" ? "default" : "outline"
                    }
                    onClick={() => onShapeSelect("line")}
                    size="icon"
                  >
                    <LineSquiggle className="size-5" />
                    {/* Line */}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <ToggleGroupItem value="camera" aria-label="Place camera">
              <CameraIcon className="size-5" />
            </ToggleGroupItem>

            <ToggleGroupItem value="person" aria-label="Place person">
              <UserRoundIcon className="size-5" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button variant="secondary" size="icon" onClick={onBackgroundClick}>
            <WallpaperIcon className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
