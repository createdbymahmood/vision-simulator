import {Expand, Minimize2} from 'lucide-react'
import React from 'react'

import type {CameraEntity} from '@/features/scene/types/types'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardFooter} from '@/components/ui/card'
import {cn} from '@/lib/utils'

import type {CameraFeedTarget} from './camera-feed-types'
import type {createCoordinateTransformer} from './simulation-helpers'

import {computeFeedRenderConfig} from './camera-feed-helpers'
import {computeFeedBoundingBoxes, useElementSize} from './camera-feed-utils'

export interface CameraFeedTileProps {
  camera: CameraEntity
  feedTarget: CameraFeedTarget
  peopleIds: string[]
  selectedPersonIds: string[]
  peopleWorld: Record<string, {x: number; y: number; z: number; height: number; name: string}>
  transformer: ReturnType<typeof createCoordinateTransformer>
  feedCount: number
  variant?: 'list' | 'grid'
}

const ENABLE_FEED_OPTICS = false

const useBodyScrollLock = (enabled: boolean) => {
  React.useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [enabled])
}

const CameraFeedTileComponent: React.FC<CameraFeedTileProps> = ({
  camera,
  feedTarget,
  peopleIds,
  selectedPersonIds,
  peopleWorld,
  transformer,
  feedCount,
  variant = 'list',
}) => {
  const isRealDeviceFeed = false
  const [isExpanded, setIsExpanded] = React.useState(false)
  const isFullscreen = !isRealDeviceFeed && isExpanded
  const isGridVariant = variant === 'grid'
  const selectedPersonIdSet = React.useMemo(
    () => new Set(selectedPersonIds),
    [selectedPersonIds],
  )
  const size = useElementSize(feedTarget.containerRef)
  const boxes = React.useMemo(() => {
    if (isRealDeviceFeed) {
      return []
    }

    return computeFeedBoundingBoxes({
      camera,
      peopleIds,
      peopleWorld,
      aspect: size.width / Math.max(size.height, 1),
      transformer,
    })
  }, [
    camera,
    isRealDeviceFeed,
    peopleIds,
    peopleWorld,
    size.height,
    size.width,
    transformer,
  ])

  const feedConfig = React.useMemo(() => {
    if (isRealDeviceFeed) {
      return null
    }
    if (typeof window === 'undefined') {
      return null
    }
    return computeFeedRenderConfig({
      feedCount,
      containerWidth: size.width,
      containerHeight: size.height,
      devicePixelRatio: window.devicePixelRatio || 1,
    })
  }, [feedCount, isRealDeviceFeed, size.height, size.width])

  const detectionCount = peopleIds.length
  useBodyScrollLock(isFullscreen)

  React.useEffect(() => {
    if (!isFullscreen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  const wrapperClassName = cn(
    'vs:w-full vs:max-w-full vs:min-w-0',
    isGridVariant ? 'vs:h-full vs:rounded-lg vs:border' : 'vs:border-b',
    isFullscreen
      ? 'vs:fixed vs:inset-0 vs:z-50 vs:bg-black vs:border-none vs:rounded-none'
      : null,
  )

  const cardClassName = cn(
    'vs:border-none vs:shadow-none',
    isGridVariant
      ? 'vs:flex vs:h-full vs:min-h-0 vs:flex-col vs:rounded-lg vs:p-3'
      : 'vs:rounded-none vs:py-4',
    isFullscreen
      ? 'vs:flex vs:h-full vs:flex-col vs:rounded-none vs:p-0'
      : null,
  )

  const feedContainerClassName = cn(
    'vs:relative vs:w-full vs:min-h-0 vs:overflow-hidden vs:bg-muted vs:text-left',
    isFullscreen || isGridVariant ? 'vs:h-full' : 'vs:aspect-video',
  )

  return (
    <div className={wrapperClassName}>
      <Card className={cardClassName}>
        <CardContent
          className={cn(
            'vs:px-0 vs:min-h-0',
            isFullscreen || isGridVariant ? 'vs:flex-1' : null,
          )}
        >
          <div className={feedContainerClassName}>
            <>
              <div
                className='vs:absolute vs:inset-0'
                ref={feedTarget.containerRef}
              />
              <canvas
                className='vs:absolute vs:inset-0 vs:h-full vs:w-full'
                ref={feedTarget.canvasRef}
              />
              {ENABLE_FEED_OPTICS ? (
                <div
                  className='vs:absolute vs:inset-0 vs:pointer-events-none'
                  style={{
                    background:
                      'radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(15,23,42,0.35) 100%)',
                  }}
                />
              ) : null}
              <div className='vs:pointer-events-none vs:absolute vs:inset-0'>
                {boxes.map((box) => (
                  <div
                    key={box.id}
                    className={`vs:absolute vs:border-2 ${
                      selectedPersonIdSet.has(box.id)
                        ? 'vs:border-purple-500'
                        : 'vs:border-yellow-300'
                    }`}
                    style={{
                      left: `${box.left * 100}%`,
                      top: `${box.top * 100}%`,
                      width: `${box.width * 100}%`,
                      height: `${box.height * 100}%`,
                    }}
                  >
                    <span
                      className={`vs:absolute vs:-top-5 vs:left-0 vs:text-[10px] vs:px-1 vs:rounded ${
                        selectedPersonIdSet.has(box.id)
                          ? 'vs:bg-purple-500/90 vs:text-white'
                          : 'vs:bg-yellow-300/90 vs:text-black'
                      }`}
                    >
                      {peopleWorld[box.id]?.name ?? box.id}
                    </span>
                  </div>
                ))}
              </div>
            </>
            {!isRealDeviceFeed ? (
              <div className='vs:absolute vs:bottom-2 vs:right-2 vs:z-20'>
                <Button
                  size='icon-sm'
                  variant='ghost'
                  className='vs:bg-black/50 vs:text-white vs:hover:bg-black/70'
                  aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
                  onClick={() => setIsExpanded((previous) => !previous)}
                >
                  {isFullscreen ? (
                    <Minimize2 className='vs:size-4' />
                  ) : (
                    <Expand className='vs:size-4' />
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>

        {!isFullscreen && !isRealDeviceFeed ? (
          <CardFooter>
            <div className='vs:flex vs:w-full vs:items-center vs:justify-between vs:text-xs vs:text-muted-foreground'>
              <span>{camera.name}</span>
              <div className='vs:flex vs:items-center vs:gap-2'>
                <Badge variant='secondary'>
                  {isRealDeviceFeed ? 'LIVE' : (feedConfig?.label ?? '---')}
                </Badge>
                <Badge
                  variant={detectionCount > 0 ? 'destructive' : 'secondary'}
                >
                  {detectionCount} detections
                </Badge>
              </div>
            </div>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  )
}

CameraFeedTileComponent.displayName = 'CameraFeedTile'

export const CameraFeedTile = React.memo(CameraFeedTileComponent)
