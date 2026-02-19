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
      <SheetContent className='vs:w-full vs:sm:max-w-md' side='right'>
        <SheetHeader>
          <SheetTitle>Area Management</SheetTitle>
          <SheetDescription>
            Select an active area, rename it, or delete areas you no longer
            need.
          </SheetDescription>
        </SheetHeader>

        <div className='vs:flex vs:items-center vs:justify-between vs:rounded-lg vs:border vs:px-3 vs:py-2'>
          <span className='vs:text-sm vs:text-muted-foreground'>
            Total areas
          </span>
          <Badge variant='secondary'>{areaCount}</Badge>
        </div>

        <div className='vs:space-y-3'>
          <Label className='vs:text-xs vs:uppercase vs:text-muted-foreground'>
            Areas
          </Label>
          {areas.length === 0 ? (
            <p className='vs:text-sm vs:text-muted-foreground'>
              No areas yet. Use the draw tool to add your first area.
            </p>
          ) : (
            <div className='vs:space-y-2'>
              {areas.map((area) => (
                <div
                  className='vs:flex vs:items-center vs:gap-3 vs:rounded-lg vs:border vs:px-3 vs:py-2'
                  key={area.id}
                >
                  <div
                    aria-hidden
                    className='vs:h-3 vs:w-3 vs:rounded-full vs:shadow-sm'
                    style={{backgroundColor: area.color}}
                  />
                  <Input
                    className='vs:h-9'
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
                  <div className='vs:flex vs:items-center vs:gap-2'>
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
                          <Trash01 className='vs:size-4' />
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
