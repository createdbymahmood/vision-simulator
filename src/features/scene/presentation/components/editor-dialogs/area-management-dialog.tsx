import {Trash01} from '@untitledui/icons'
import React from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {useHistoryRecorder} from '@/features/scene/presentation/hooks/use-history-recorder'

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
  const {recordAction} = useHistoryRecorder()
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
                    onBlur={(event) => {
                      const nextName = event.target.value
                      if (nextName === area.name) {
                        return
                      }
                      const updated = updateAreaName(area.id, nextName)
                      recordAction({type: 'update', entity: 'area'}, updated)
                    }}
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size='icon' variant='ghost'>
                          <Trash01 className='size-4' />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete area?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deleting "{area.name}" will also remove its walls,
                            shapes, cameras, and people.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant='destructive'
                            onClick={() => {
                              const updated = deleteArea(area.id)
                              recordAction(
                                {type: 'delete', entity: 'area'},
                                updated,
                              )
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
