import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MapPlaceholder() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-6">
      <Card>
        <CardHeader>
          <CardTitle>Map Editor</CardTitle>
          <CardDescription>
            Map mode placeholder — canvas editor is active for this phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Switch back to Canvas to continue building the simulation layout.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

MapPlaceholder.displayName = "map-placeholder";
