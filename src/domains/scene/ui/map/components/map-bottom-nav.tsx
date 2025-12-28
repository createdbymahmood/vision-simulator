import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pointer, SquarePlus, PenLine, Shapes, PersonStanding } from "lucide-react";
import type { ToolId } from "@/domains/scene/core/types";

const shapeTools: ToolId[] = ["shape-rectangle", "shape-circle", "shape-triangle", "shape-line"];

interface MapBottomNavProps {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  devicePicker: React.ReactNode;
}

export function MapBottomNav({ activeTool, onSelectTool, devicePicker }: MapBottomNavProps) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/70 bg-card/90 px-3 py-2 shadow-lg">
        <Button variant={activeTool === "select" ? "default" : "ghost"} size="sm" onClick={() => onSelectTool("select")}>
          <Pointer className="mr-1 h-4 w-4" /> Selector
        </Button>
        <Button variant={activeTool === "area" ? "default" : "ghost"} size="sm" onClick={() => onSelectTool("area")}>
          <SquarePlus className="mr-1 h-4 w-4" /> Area
        </Button>
        <Button variant={activeTool === "wall" ? "default" : "ghost"} size="sm" onClick={() => onSelectTool("wall")}>
          <PenLine className="mr-1 h-4 w-4" /> Wall
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={activeTool.startsWith("shape") ? "default" : "ghost"} size="sm">
              <Shapes className="mr-1 h-4 w-4" /> Shape
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[200px]">
            <div className="grid grid-cols-2 gap-2">
              {shapeTools.map((tool) => (
                <Button key={tool} variant="secondary" size="sm" onClick={() => onSelectTool(tool)}>
                  {tool.replace("shape-", "")}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {devicePicker}
        <Button variant={activeTool === "person" ? "default" : "ghost"} size="sm" onClick={() => onSelectTool("person")}>
          <PersonStanding className="mr-1 h-4 w-4" /> Person
        </Button>
      </div>
    </div>
  );
}
