import React from 'react'

import type {CameraEntity} from '@/features/scene/domain/types'

import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardFooter} from '@/components/ui/card'

import type {CameraFeedTarget} from './camera-feed-types'
import type {createCoordinateTransformer} from './simulation-helpers'

import {computeFeedRenderConfig} from './camera-feed-helpers'
import {computeFeedBoundingBoxes, useElementSize} from './camera-feed-utils'
import {RealDeviceFeedPlayer} from './real-device-feed-player'

interface CameraFeedTileProps {
  camera: CameraEntity
  feedTarget: CameraFeedTarget
  peopleIds: string[]
  selectedPersonIds: string[]
  peopleWorld: Record<string, {x: number; y: number; z: number; height: number}>
  transformer: ReturnType<typeof createCoordinateTransformer>
  feedCount: number
}

const ENABLE_FEED_OPTICS = false

export const CameraFeedTile: React.FC<CameraFeedTileProps> = ({
  camera,
  feedTarget,
  peopleIds,
  selectedPersonIds,
  peopleWorld,
  transformer,
  feedCount,
}) => {
  const isRealDeviceFeed = camera.sourceDeviceKind === 'real'
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
    <div className='w-full max-w-full min-w-0 border-b'>
      <Card className='border-none rounded-none shadow-none py-4'>
        <CardContent className='px-0'>
          <div className='relative w-full aspect-video overflow-hidden bg-muted text-left'>
            {isRealDeviceFeed ? (
              <RealDeviceFeedPlayer camera={camera} />
            ) : (
              <>
                <div
                  className='absolute inset-0'
                  ref={feedTarget.containerRef}
                />
                <canvas
                  className='absolute inset-0 h-full w-full'
                  ref={feedTarget.canvasRef}
                />
                {ENABLE_FEED_OPTICS ? (
                  <div
                    className='absolute inset-0 pointer-events-none'
                    style={{
                      background:
                        'radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(15,23,42,0.35) 100%)',
                    }}
                  />
                ) : null}
                <div className='pointer-events-none absolute inset-0'>
                  {boxes.map((box) => (
                    <div
                      key={box.id}
                      className={`absolute border-2 ${
                        selectedPersonIds.includes(box.id)
                          ? 'border-purple-500'
                          : 'border-yellow-300'
                      }`}
                      style={{
                        left: `${box.left * 100}%`,
                        top: `${box.top * 100}%`,
                        width: `${box.width * 100}%`,
                        height: `${box.height * 100}%`,
                      }}
                    >
                      <span
                        className={`absolute -top-5 left-0 text-[10px] px-1 rounded ${
                          selectedPersonIds.includes(box.id)
                            ? 'bg-purple-500/90 text-white'
                            : 'bg-yellow-300/90 text-black'
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
          <div className='flex w-full items-center justify-between text-xs text-muted-foreground'>
            <span>{camera.name}</span>
            <div className='flex items-center gap-2'>
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
