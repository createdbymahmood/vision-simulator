import React from 'react'

import type {CameraEntity} from '@/features/scene/types/types'

import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardFooter} from '@/components/ui/card'

import type {CameraFeedTarget} from './camera-feed-types'
import type {createCoordinateTransformer} from './simulation-helpers'

import {computeFeedRenderConfig} from './camera-feed-helpers'
import {computeFeedBoundingBoxes, useElementSize} from './camera-feed-utils'
import {RealDeviceFeedPlayer} from './real-device-feed-player'

export interface CameraFeedTileProps {
  camera: CameraEntity
  feedTarget: CameraFeedTarget
  peopleIds: string[]
  selectedPersonIds: string[]
  peopleWorld: Record<string, {x: number; y: number; z: number; height: number}>
  transformer: ReturnType<typeof createCoordinateTransformer>
  feedCount: number
}

const ENABLE_FEED_OPTICS = false

const CameraFeedTileComponent: React.FC<CameraFeedTileProps> = ({
  camera,
  feedTarget,
  peopleIds,
  selectedPersonIds,
  peopleWorld,
  transformer,
  feedCount,
}) => {
  const isRealDeviceFeed = camera.sourceDeviceKind === 'real'
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

  return (
    <div className='vs:w-full vs:max-w-full vs:min-w-0 vs:border-b'>
      <Card className='vs:border-none vs:rounded-none vs:shadow-none vs:py-4'>
        <CardContent className='vs:px-0'>
          <div className='vs:relative vs:w-full vs:aspect-video vs:overflow-hidden vs:bg-muted vs:text-left'>
            {isRealDeviceFeed ? (
              <RealDeviceFeedPlayer camera={camera} autoPlay />
            ) : (
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
                        {box.id}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <div className='vs:flex vs:w-full vs:items-center vs:justify-between vs:text-xs vs:text-muted-foreground'>
            <span>{camera.name}</span>
            <div className='vs:flex vs:items-center vs:gap-2'>
              <Badge variant='secondary'>
                {isRealDeviceFeed ? 'LIVE' : (feedConfig?.label ?? '---')}
              </Badge>
              <Badge variant={detectionCount > 0 ? 'destructive' : 'secondary'}>
                {detectionCount} detections
              </Badge>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

CameraFeedTileComponent.displayName = 'CameraFeedTile'

export const CameraFeedTile = React.memo(CameraFeedTileComponent)
