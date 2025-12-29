import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { SceneEntity } from "../../core/scene-types";

interface PropertiesSidebarProps {
  open: boolean;
  selected: SceneEntity | null;
  onClose: () => void;
}

export function PropertiesSidebar({
  open,
  selected,
  onClose,
}: PropertiesSidebarProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Properties</SheetTitle>
          <SheetDescription>
            Contextual inspector driven by scene selection.
          </SheetDescription>
        </SheetHeader>
        {selected ? (
          <div className="space-y-4">
            <div className="text-sm font-medium">
              {selected.id} ({(selected as { type?: string }).type ?? "entity"})
            </div>
            <Separator />
            <pre className="text-xs leading-6">
              {JSON.stringify(selected, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Nothing selected. Click an entity chip or the workspace to close.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}

PropertiesSidebar.displayName = "properties-sidebar";
