import React from 'react'
import * as THREE from 'three'

import type {CameraEntity} from '@/features/scene/domain/types'

import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardFooter} from '@/components/ui/card'
import {DEFAULT_PERSON_RADIUS} from '@/features/scene/domain/constants/person-defaults'

import type {createCoordinateTransformer} from './simulation-helpers'
import type {CameraFeedTarget} from './simulation-scene'

import {getCameraOpticHeight} from './camera-collision-utils'

interface BoundingBox {
  id: string
  left: number
  top: number
  width: number
  height: number
}

interface CameraFeedTileProps {
  camera: CameraEntity
  feedTarget: CameraFeedTarget
  peopleIds: string[]
  peopleWorld: Record<string, {x: number; y: number; z: number; height: number}>
  transformer: ReturnType<typeof createCoordinateTransformer>
}

const degToRad = (deg: number) => (deg * Math.PI) / 180

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const useElementSize = (ref: React.RefObject<HTMLDivElement>) => {
  const [size, setSize] = React.useState({width: 1, height: 1})

  React.useLayoutEffect(() => {
    if (!ref.current) {
      return
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }
      const {width, height} = entry.contentRect
      setSize({width, height})
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])

  return size
}

const computeBoundingBoxes = ({
  camera,
  peopleIds,
  peopleWorld,
  aspect,
  transformer,
}: {
  camera: CameraEntity
  peopleIds: string[]
  peopleWorld: Record<string, {x: number; y: number; z: number; height: number}>
  aspect: number
  transformer: ReturnType<typeof createCoordinateTransformer>
}) => {
  if (peopleIds.length === 0) {
    return []
  }
  const base = transformer.toVector3([camera.x, camera.y], 0)
  const opticHeight = getCameraOpticHeight(camera)
  const fov = camera.fov / Math.max(camera.ptz?.zoom ?? 1, 0.0001)
  const near = Math.max(camera.nearClipping ?? 0.1, 0.1)
  const far = Math.max(camera.depth, near + 0.1)
  const yaw = -degToRad(camera.ptz?.pan ?? camera.direction)
  const tilt = degToRad(camera.ptz?.tilt ?? 0)
  const cameraView = new THREE.PerspectiveCamera(fov, aspect || 1, near, far)
  cameraView.position.set(base.x, opticHeight, base.z)
  cameraView.rotation.set(tilt, yaw, 0, 'YXZ')
  cameraView.updateProjectionMatrix()
  cameraView.updateMatrixWorld()

  const boxes: BoundingBox[] = []
  peopleIds.forEach((personId) => {
    const person = peopleWorld[personId]
    if (!person) {
      return
    }
    const height = Math.max(person.height, DEFAULT_PERSON_RADIUS * 2)
    const min = new THREE.Vector3(
      person.x - DEFAULT_PERSON_RADIUS,
      0,
      person.z - DEFAULT_PERSON_RADIUS,
    )
    const max = new THREE.Vector3(
      person.x + DEFAULT_PERSON_RADIUS,
      height,
      person.z + DEFAULT_PERSON_RADIUS,
    )
    const corners = [
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(min.x, min.y, max.z),
      new THREE.Vector3(min.x, max.y, min.z),
      new THREE.Vector3(min.x, max.y, max.z),
      new THREE.Vector3(max.x, min.y, min.z),
      new THREE.Vector3(max.x, min.y, max.z),
      new THREE.Vector3(max.x, max.y, min.z),
      new THREE.Vector3(max.x, max.y, max.z),
    ]
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    corners.forEach((corner) => {
      const projected = corner.clone().project(cameraView)
      minX = Math.min(minX, projected.x)
      maxX = Math.max(maxX, projected.x)
      minY = Math.min(minY, projected.y)
      maxY = Math.max(maxY, projected.y)
    })
    if (maxX < -1 || minX > 1 || maxY < -1 || minY > 1) {
      return
    }
    const left = clamp01((minX + 1) / 2)
    const right = clamp01((maxX + 1) / 2)
    const top = clamp01((1 - maxY) / 2)
    const bottom = clamp01((1 - minY) / 2)
    const width = Math.max(right - left, 0)
    const heightPx = Math.max(bottom - top, 0)
    boxes.push({id: personId, left, top, width, height: heightPx})
  })
  return boxes
}

export const CameraFeedTile: React.FC<CameraFeedTileProps> = ({
  camera,
  feedTarget,
  peopleIds,
  peopleWorld,
  transformer,
}) => {
  const size = useElementSize(feedTarget.ref)
  const boxes = React.useMemo(
    () =>
      computeBoundingBoxes({
        camera,
        peopleIds,
        peopleWorld,
        aspect: size.width / Math.max(size.height, 1),
        transformer,
      }),
    [camera, peopleIds, peopleWorld, size.height, size.width, transformer],
  )

  const detectionCount = peopleIds.length

  return (
    <div className='border-b'>
      <Card className='border-none rounded-none shadow-none py-4'>
        <CardContent className='px-0'>
          <div className='relative w-full aspect-video bg-muted overflow-hidden'>
            <div className='absolute inset-0' ref={feedTarget.ref} />
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
          </div>
        </CardContent>

        <CardFooter>
          <div className='flex w-full items-center justify-between text-xs text-muted-foreground'>
            <span>{camera.name}</span>
            <Badge variant={detectionCount > 0 ? 'destructive' : 'secondary'}>
              {detectionCount} detections
            </Badge>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
