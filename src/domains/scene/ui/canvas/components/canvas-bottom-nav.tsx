import {
  Camera,
  Grid,
  PenLine,
  PersonStanding,
  Pointer,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ToolId } from "@/domains/scene/core/types";

const shapeTools: { label: string; value: ToolId }[] = [
  { label: "Rectangle", value: "shape-rectangle" },
  { label: "Circle", value: "shape-circle" },
  { label: "Triangle", value: "shape-triangle" },
  { label: "Line", value: "shape-line" },
];

interface CanvasBottomNavProps {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  onBackgroundPick: () => void;
}

export function CanvasBottomNav({
  activeTool,
  onSelectTool,
  onBackgroundPick,
}: CanvasBottomNavProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex items-center justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/70 bg-card/90 px-3 py-2 shadow-lg">
        <Button
          variant={activeTool === "select" ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelectTool("select")}
        >
          <Pointer className="mr-1 h-4 w-4" /> Select
        </Button>
        <Button
          variant={activeTool === "wall" ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelectTool("wall")}
        >
          <PenLine className="mr-1 h-4 w-4" /> Wall
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={activeTool.startsWith("shape") ? "default" : "ghost"}
              size="sm"
            >
              <Grid className="mr-1 h-4 w-4" /> Shape
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[180px]">
            <div className="grid grid-cols-2 gap-2">
              {shapeTools.map((shape) => (
                <Button
                  key={shape.value}
                  variant="secondary"
                  size="sm"
                  onClick={() => onSelectTool(shape.value)}
                >
                  {shape.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant={activeTool === "camera" ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelectTool("camera")}
        >
          <Camera className="mr-1 h-4 w-4" /> Camera
        </Button>
        <Button
          variant={activeTool === "person" ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelectTool("person")}
        >
          <PersonStanding className="mr-1 h-4 w-4" /> Person
        </Button>
        <Button variant="ghost" size="sm" onClick={onBackgroundPick}>
          <Upload className="mr-1 h-4 w-4" /> Background
        </Button>
      </div>
    </div>
  );
}
