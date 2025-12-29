import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { SceneMode, SceneTool } from "../../core/scene-types";

interface SceneCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMode: (mode: SceneMode) => void;
  onSelectTool: (tool: SceneTool) => void;
  onResetScene: () => void;
}

export function SceneCommandPalette({
  open,
  onOpenChange,
  onSelectMode,
  onSelectTool,
  onResetScene,
}: SceneCommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to a command" />
      <CommandList>
        <CommandGroup heading="Modes">
          <CommandItem onSelect={() => onSelectMode("canvas")}>
            Canvas mode
          </CommandItem>
          <CommandItem onSelect={() => onSelectMode("map")}>Map mode</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Tools">
          <CommandItem onSelect={() => onSelectTool("select")}>Select</CommandItem>
          <CommandItem onSelect={() => onSelectTool("wall")}>Wall</CommandItem>
          <CommandItem onSelect={() => onSelectTool("camera")}>Camera</CommandItem>
          <CommandItem onSelect={() => onSelectTool("shape")}>Shape</CommandItem>
          <CommandItem onSelect={() => onSelectTool("person")}>Person</CommandItem>
          <CommandItem onSelect={() => onSelectTool("area")}>Area</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Scene">
          <CommandItem onSelect={onResetScene}>Reset scene</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

SceneCommandPalette.displayName = "scene-command-palette";
