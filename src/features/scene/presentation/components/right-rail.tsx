import {Layers, Map, Search, Video} from 'lucide-react'
import React from 'react'

import {Button} from '@/components/ui/button'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'

interface RightRailProps {
  isMapMode: boolean
  isEditMode: boolean
  onSearchLocation: () => void
  onAreaManagement: () => void
  onMapViewMode: () => void
  onDevicesInUse: () => void
  areaCount?: number
  deviceCount?: number
}

const railButtonClass = 'relative h-12 w-12 rounded-lg'

export const RightRail: React.FC<RightRailProps> = ({
  isMapMode,
  isEditMode,
  onSearchLocation,
  onAreaManagement,
  onMapViewMode,
  onDevicesInUse,
}) => {
  return (
    <div className='fixed right-4 top-24 z-30 w-12'>
      <div className='flex flex-col items-center gap-2'>
        {isMapMode ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                aria-label='Search location (⌘K)'
                className={railButtonClass}
                disabled={!isEditMode}
                variant='outline'
                onClick={onSearchLocation}
              >
                <Search className='size-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side='left'>Search location (⌘K)</TooltipContent>
          </Tooltip>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              aria-label='Areas (⌘⇧A)'
              className={railButtonClass}
              disabled={!isEditMode}
              variant='outline'
              onClick={onAreaManagement}
            >
              <Layers className='size-5' />
              {/*  <Badge className='absolute -right-2 -top-2 min-w-6 justify-center'>
                {areaCount}
              </Badge> */}
            </Button>
          </TooltipTrigger>
          <TooltipContent side='left'>Areas (⌘⇧A)</TooltipContent>
        </Tooltip>

        {isMapMode ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                aria-label='Map style'
                className={railButtonClass}
                disabled={!isEditMode}
                variant='outline'
                onClick={onMapViewMode}
              >
                <Map className='size-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side='left'>Map style</TooltipContent>
          </Tooltip>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              aria-label='Devices (⌘⇧D)'
              className={railButtonClass}
              disabled={!isEditMode}
              variant='outline'
              onClick={onDevicesInUse}
            >
              <Video className='size-5' />
              {/*  <Badge className='absolute -right-2 -top-2 min-w-6 justify-center'>
                {deviceCount}
              </Badge> */}
            </Button>
          </TooltipTrigger>
          <TooltipContent side='left'>Devices (⌘⇧D)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
