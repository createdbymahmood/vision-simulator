import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertiesHeaderProps {
  title: string;
  subtitle?: string;
  onDelete: () => void;
}

export function PropertiesHeader({ title, subtitle, onDelete }: PropertiesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Properties</p>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete selected">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
