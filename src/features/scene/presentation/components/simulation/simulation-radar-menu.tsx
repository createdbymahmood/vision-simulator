import React from 'react'

import {
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu'
import type {RadarSettings} from '@/features/scene/infrastructure/stores/ui.store'

interface SimulationRadarMenuProps {
  radarSettings: RadarSettings
  onUpdateSettings: (settings: Partial<RadarSettings>) => void
  onResetZoom: () => void
}

export const SimulationRadarMenu: React.FC<SimulationRadarMenuProps> = ({
  radarSettings,
  onUpdateSettings,
  onResetZoom,
}) => (
  <ContextMenuContent>
    <ContextMenuCheckboxItem
      checked={radarSettings.showWedges}
      onCheckedChange={(value) =>
        onUpdateSettings({showWedges: Boolean(value)})
      }
    >
      Show Camera FOV
    </ContextMenuCheckboxItem>
    <ContextMenuCheckboxItem
      checked={radarSettings.showTrails}
      onCheckedChange={(value) =>
        onUpdateSettings({showTrails: Boolean(value)})
      }
    >
      Show Trails
    </ContextMenuCheckboxItem>
    <ContextMenuCheckboxItem
      checked={radarSettings.showGrid}
      onCheckedChange={(value) =>
        onUpdateSettings({showGrid: Boolean(value)})
      }
    >
      Show Grid
    </ContextMenuCheckboxItem>
    <ContextMenuCheckboxItem
      checked={radarSettings.isLocked}
      onCheckedChange={(value) =>
        onUpdateSettings({isLocked: Boolean(value)})
      }
    >
      Lock Position
    </ContextMenuCheckboxItem>
    <ContextMenuItem onClick={onResetZoom}>Reset Zoom</ContextMenuItem>
  </ContextMenuContent>
)
