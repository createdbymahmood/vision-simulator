import React from 'react'
import * as THREE from 'three'

import type {CameraEntity} from '@/features/scene/domain/types'

import {DEFAULT_PERSON_RADIUS} from '@/features/scene/domain/constants/person-defaults'

import type {createCoordinateTransformer} from './simulation-helpers'

import {getCameraOpticHeight} from './camera-collision-utils'
import {getFeedVerticalFov} from './camera-feed-fov'

export interface FeedBoundingBox {
  id: string
  left: number
  top: number
  width: number
  height: number
}

const degToRad = (deg: number) => (deg * Math.PI) / 180

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const MIN_CAMERA_NEAR_DISTANCE = 0.1

export const useElementSize = (ref: React.RefObject<HTMLDivElement>) => {
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

export const computeFeedBoundingBoxes = ({
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
}): FeedBoundingBox[] => {
  if (peopleIds.length === 0) {
    return []
  }
  const base = transformer.toVector3([camera.x, camera.y], 0)
  const opticHeight = getCameraOpticHeight(camera)
  const fov = getFeedVerticalFov(camera)
  const near = MIN_CAMERA_NEAR_DISTANCE
  const far = Math.max(camera.depth, near + 0.1)
  const yaw = -degToRad(camera.ptz?.pan ?? camera.direction)
  const tilt = degToRad(camera.ptz?.tilt ?? 0)
  const cameraView = new THREE.PerspectiveCamera(fov, aspect || 1, near, far)
  cameraView.position.set(base.x, opticHeight, base.z)
  cameraView.rotation.set(tilt, yaw, 0, 'YXZ')
  cameraView.updateProjectionMatrix()
  cameraView.updateMatrixWorld()

  const boxes: FeedBoundingBox[] = []
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
