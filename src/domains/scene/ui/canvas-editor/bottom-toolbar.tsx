import {
  ArrowLeftRightIcon,
  CameraIcon,
  Circle,
  LineSquiggle,
  MousePointer2Icon,
  RectangleCircle,
  ShapesIcon,
  TriangleIcon,
  UserRoundIcon,
  WallpaperIcon,
} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group'

import type {SceneTool} from '../../core/scene-types'

export function CanvasBottomToolbar({
  activeTool,
  activeShapeLabel,
  onToolChange,
  onShapeSelect,
  onBackgroundClick,
}: {
  activeTool: SceneTool
  activeShapeLabel: string
  onToolChange: (tool: SceneTool) => void
  onShapeSelect: (shape: 'circle' | 'line' | 'rectangle' | 'triangle') => void
  onBackgroundClick: () => void
}) {
  return (
    <div className='fixed inset-x-0 bottom-6 z-30 flex justify-center px-4'>
      <div className='flex w-full max-w-fit items-center gap-4 rounded-full border bg-background/95 px-4 py-3 shadow-md backdrop-blur justify-center'>
        <div className='flex flex-row gap-2 items-center'>
          <ToggleGroup
            spacing={4}
            type='single'
            value={activeTool}
            onValueChange={(value) => {
              if (!value) return
              onToolChange(value as SceneTool)
            }}
          >
            <ToggleGroupItem aria-label='Select tool' value='select'>
              <MousePointer2Icon className='size-5' />
            </ToggleGroupItem>

            <ToggleGroupItem aria-label='Draw wall tool' value='wall'>
              <ArrowLeftRightIcon className='size-5' />
            </ToggleGroupItem>
            <Popover>
              <PopoverTrigger asChild>
                <ToggleGroupItem aria-label='Draw shapes' value='shape'>
                  <ShapesIcon className='size-5' />
                  {/* {activeShapeLabel} */}
                </ToggleGroupItem>
              </PopoverTrigger>
              <PopoverContent className='w-fit'>
                <div className='flex flex-col gap-2'>
                  <Button
                    size='icon'
                    onClick={() => onShapeSelect('rectangle')}
                    variant={
                      activeShapeLabel === 'Rectangle' ? 'default' : 'outline'
                    }
                  >
                    <RectangleCircle className='size-5' />
                    {/* Rectangle */}
                  </Button>
                  <Button
                    size='icon'
                    onClick={() => onShapeSelect('circle')}
                    variant={
                      activeShapeLabel === 'Circle' ? 'default' : 'outline'
                    }
                  >
                    <Circle className='size-5' />
                    {/* Circle */}
                  </Button>
                  <Button
                    size='icon'
                    onClick={() => onShapeSelect('triangle')}
                    variant={
                      activeShapeLabel === 'Triangle' ? 'default' : 'outline'
                    }
                  >
                    <TriangleIcon className='size-5' />
                    {/* Triangle */}
                  </Button>
                  <Button
                    size='icon'
                    onClick={() => onShapeSelect('line')}
                    variant={
                      activeShapeLabel === 'Line' ? 'default' : 'outline'
                    }
                  >
                    <LineSquiggle className='size-5' />
                    {/* Line */}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <ToggleGroupItem aria-label='Place camera' value='camera'>
              <CameraIcon className='size-5' />
            </ToggleGroupItem>

            <ToggleGroupItem aria-label='Place person' value='person'>
              <UserRoundIcon className='size-5' />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button size='icon' variant='secondary' onClick={onBackgroundClick}>
            <WallpaperIcon className='size-5' />
          </Button>
        </div>
      </div>
    </div>
  )
}
