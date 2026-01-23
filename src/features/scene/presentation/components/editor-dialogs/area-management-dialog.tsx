import React from 'react'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Separator} from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

interface AreaManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  areaCount: number
}

export const AreaManagementDialog: React.FC<AreaManagementDialogProps> = ({
  open,
  onOpenChange,
  areaCount,
}) => {
  const areas = useSceneStore((state) => state.scene.areas)
  const activeAreaId = useSceneStore((state) => state.scene.activeAreaId)
  const setActiveArea = useSceneStore((state) => state.setActiveArea)
  const updateAreaName = useSceneStore((state) => state.updateAreaName)
  const deleteArea = useSceneStore((state) => state.deleteArea)
  const triggerFlyToActiveArea = useUiStore(
    (state) => state.triggerFlyToActiveArea,
  )

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className='w-full sm:max-w-md' side='right'>
        <SheetHeader>
          <SheetTitle>Area Management</SheetTitle>
          <SheetDescription>
            Select an active area, rename it, or delete areas you no longer
            need.
          </SheetDescription>
        </SheetHeader>

        <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
          <span className='text-sm text-muted-foreground'>Total areas</span>
          <Badge variant='secondary'>{areaCount}</Badge>
        </div>

        <Separator className='my-4' />

        <div className='space-y-3'>
          <Label className='text-xs uppercase text-muted-foreground'>
            Areas
          </Label>
          {areas.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No areas yet. Use the draw tool to add your first area.
            </p>
          ) : (
            <div className='space-y-2'>
              {areas.map((area) => (
                <div
                  className='flex items-center gap-3 rounded-lg border px-3 py-2'
                  key={area.id}
                >
                  <div
                    aria-hidden
                    className='h-3 w-3 rounded-full shadow-sm'
                    style={{backgroundColor: area.color}}
                  />
                  <Input
                    className='h-9'
                    defaultValue={area.name}
                    onBlur={(event) =>
                      updateAreaName(area.id, event.target.value)
                    }
                  />
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline'>{area.pointCount} pts</Badge>
                    <Button
                      size='sm'
                      variant={area.id === activeAreaId ? 'default' : 'outline'}
                      onClick={() => {
                        setActiveArea(area.id)
                        triggerFlyToActiveArea()
                        onOpenChange(false)
                      }}
                    >
                      {area.id === activeAreaId ? 'Active' : 'Select'}
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      onClick={() => deleteArea(area.id)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
