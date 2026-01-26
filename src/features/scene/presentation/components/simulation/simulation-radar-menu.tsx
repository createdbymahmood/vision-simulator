import React from 'react'
import {useCallbackRef} from '@radix-ui/react-use-callback-ref'

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
}) => {
  const handleToggleWedges = useCallbackRef((event: Event) => {
    event.preventDefault()
    onUpdateSettings({showWedges: !radarSettings.showWedges})
  })

  const handleToggleTrails = useCallbackRef((event: Event) => {
    event.preventDefault()
    onUpdateSettings({showTrails: !radarSettings.showTrails})
  })

  const handleToggleGrid = useCallbackRef((event: Event) => {
    event.preventDefault()
    onUpdateSettings({showGrid: !radarSettings.showGrid})
  })

  const handleToggleLock = useCallbackRef((event: Event) => {
    event.preventDefault()
    onUpdateSettings({isLocked: !radarSettings.isLocked})
  })

  return (
    <ContextMenuContent>
      <ContextMenuCheckboxItem
        checked={radarSettings.showWedges}
        onSelect={handleToggleWedges}
      >
        Show Camera FOV
      </ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem
        checked={radarSettings.showTrails}
        onSelect={handleToggleTrails}
      >
        Show Trails
      </ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem
        checked={radarSettings.showGrid}
        onSelect={handleToggleGrid}
      >
        Show Grid
      </ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem
        checked={radarSettings.isLocked}
        onSelect={handleToggleLock}
      >
        Lock Position
      </ContextMenuCheckboxItem>
      <ContextMenuItem onClick={onResetZoom}>Reset Zoom</ContextMenuItem>
    </ContextMenuContent>
  )
}
