import * as THREE from 'three'

import type {CameraEntity} from '@/features/scene/domain/types'

import {getEffectiveHorizontalFov} from '@/features/scene/domain/services/camera-optics'

const BODY_HEIGHT = 0.6

const degToRad = (deg: number) => (deg * Math.PI) / 180
const MAX_RENDER_FOV_DEG = 150
const MIN_CAMERA_NEAR_DISTANCE = 0.1

const getHorizontalFov = (camera: CameraEntity) => {
  return degToRad(
    Math.min(getEffectiveHorizontalFov(camera), MAX_RENDER_FOV_DEG),
  )
}

export const getCameraOpticHeight = (camera: CameraEntity) => {
  const standHeight = Math.max(camera.height - BODY_HEIGHT, 0.4)
  return standHeight + BODY_HEIGHT * 0.5
}

export const createCameraFrustumPlanes = (
  camera: CameraEntity,
  position: THREE.Vector3,
  opticHeight: number,
) => {
  const horizontalFov = getHorizontalFov(camera)
  const near = MIN_CAMERA_NEAR_DISTANCE
  const far = Math.max(camera.depth, near + 0.1)
  const tilt = degToRad(camera.ptz?.tilt ?? 0)
  const yaw = -degToRad(camera.ptz.pan)
  const halfFov = horizontalFov / 2
  const radialSegments = 32

  const rotation = new THREE.Euler(tilt, yaw, 0, 'YXZ')
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(rotation).normalize()
  const right = new THREE.Vector3(1, 0, 0).applyEuler(rotation).normalize()
  const up = new THREE.Vector3(0, 1, 0).applyEuler(rotation).normalize()
  const origin = new THREE.Vector3(position.x, opticHeight, position.z)

  const planes: THREE.Plane[] = []
  for (let i = 0; i < radialSegments; i += 1) {
    const angle = (i / radialSegments) * Math.PI * 2
    const edge = right
      .clone()
      .multiplyScalar(Math.cos(angle))
      .add(up.clone().multiplyScalar(Math.sin(angle)))
      .normalize()
    const dirOnCone = forward
      .clone()
      .multiplyScalar(Math.cos(halfFov))
      .add(edge.clone().multiplyScalar(Math.sin(halfFov)))
      .normalize()
    const normal = dirOnCone.clone().cross(forward).normalize()
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      normal,
      origin,
    )
    const testPoint = origin.clone().add(forward)
    if (plane.distanceToPoint(testPoint) > 0) {
      plane.negate()
    }
    planes.push(plane)
  }

  const nearPoint = origin.clone().add(forward.clone().multiplyScalar(near))
  const nearPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
    forward.clone().negate(),
    nearPoint,
  )
  if (
    nearPlane.distanceToPoint(
      origin.clone().add(forward.clone().multiplyScalar(near + 1)),
    ) > 0
  ) {
    nearPlane.negate()
  }
  planes.push(nearPlane)

  const farPoint = origin.clone().add(forward.clone().multiplyScalar(far))
  const farPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
    forward.clone(),
    farPoint,
  )
  if (
    farPlane.distanceToPoint(
      origin.clone().add(forward.clone().multiplyScalar(far - 0.1)),
    ) > 0
  ) {
    farPlane.negate()
  }
  planes.push(farPlane)

  return planes
}
