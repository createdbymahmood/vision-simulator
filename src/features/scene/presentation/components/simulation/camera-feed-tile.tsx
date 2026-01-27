import React from 'react'

import type {CameraEntity} from '@/features/scene/domain/types'

import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardFooter} from '@/components/ui/card'

import type {CameraFeedTarget} from './camera-feed-types'
import type {createCoordinateTransformer} from './simulation-helpers'

import {computeFeedRenderConfig} from './camera-feed-helpers'
import {computeFeedBoundingBoxes, useElementSize} from './camera-feed-utils'

interface CameraFeedTileProps {
  camera: CameraEntity
  feedTarget: CameraFeedTarget
  peopleIds: string[]
  peopleWorld: Record<string, {x: number; y: number; z: number; height: number}>
  transformer: ReturnType<typeof createCoordinateTransformer>
  feedCount: number
  onSelect: (cameraId: string) => void
}

const ENABLE_FEED_OPTICS = false

export const CameraFeedTile: React.FC<CameraFeedTileProps> = ({
  camera,
  feedTarget,
  peopleIds,
  peopleWorld,
  transformer,
  feedCount,
  onSelect,
}) => {
  const size = useElementSize(feedTarget.containerRef)
  const boxes = React.useMemo(
    () =>
      computeFeedBoundingBoxes({
        camera,
        peopleIds,
        peopleWorld,
        aspect: size.width / Math.max(size.height, 1),
        transformer,
      }),
    [camera, peopleIds, peopleWorld, size.height, size.width, transformer],
  )

  const feedConfig = React.useMemo(() => {
    if (typeof window === 'undefined') {
      return null
    }
    return computeFeedRenderConfig({
      feedCount,
      containerWidth: size.width,
      containerHeight: size.height,
      devicePixelRatio: window.devicePixelRatio || 1,
    })
  }, [feedCount, size.height, size.width])

  const detectionCount = peopleIds.length

  return (
    <div className='border-b'>
      <Card className='border-none rounded-none shadow-none py-4'>
        <CardContent className='px-0'>
          <button
            aria-label={`Select ${camera.name}`}
            className='relative w-full aspect-video overflow-hidden rounded-md bg-muted text-left border-2'
            style={{borderColor: camera.color}}
            type='button'
            onClick={() => onSelect(camera.id)}
          >
            <div className='absolute inset-0' ref={feedTarget.containerRef} />
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
                  className='absolute border-2 border-yellow-300'
                  key={box.id}
                  style={{
                    left: `${box.left * 100}%`,
                    top: `${box.top * 100}%`,
                    width: `${box.width * 100}%`,
                    height: `${box.height * 100}%`,
                  }}
                >
                  <span className='absolute -top-5 left-0 bg-yellow-300/90 text-black text-[10px] px-1 rounded'>
                    {box.id}
                  </span>
                </div>
              ))}
            </div>
          </button>
        </CardContent>

        <CardFooter>
          <div className='flex w-full items-center justify-between text-xs text-muted-foreground'>
            <span>{camera.name}</span>
            <div className='flex items-center gap-2'>
              <Badge variant='secondary'>{feedConfig?.label ?? '---'}</Badge>
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
