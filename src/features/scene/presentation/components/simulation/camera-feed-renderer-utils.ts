import * as THREE from 'three'

import type {CameraEntity} from '@/features/scene/domain/types'

import type {CoordinateTransformer} from './simulation-helpers'

import {getCameraOpticHeight} from './camera-collision-utils'

const degToRad = (deg: number) => (deg * Math.PI) / 180

export const createFeedRenderer = (canvas: HTMLCanvasElement) => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.localClippingEnabled = true
  renderer.setPixelRatio(1)
  return renderer
}

export const updateFeedCamera = ({
  camera,
  cameraEntity,
  transformer,
  aspect,
}: {
  camera: THREE.PerspectiveCamera
  cameraEntity: CameraEntity
  transformer: CoordinateTransformer
  aspect: number
}) => {
  const base = transformer.toVector3([cameraEntity.x, cameraEntity.y], 0)
  const opticHeight = getCameraOpticHeight(cameraEntity)
  const fov = cameraEntity.fov / Math.max(cameraEntity.ptz?.zoom ?? 1, 0.0001)
  const near = Math.max(cameraEntity.nearClipping ?? 0.1, 0.1)
  const far = Math.max(cameraEntity.depth, near + 0.1)
  const yaw = -degToRad(cameraEntity.ptz?.pan ?? cameraEntity.direction)
  const tilt = degToRad(cameraEntity.ptz?.tilt ?? 0)

  camera.position.set(base.x, opticHeight, base.z)
  camera.rotation.set(tilt, yaw, 0, 'YXZ')

  if (
    camera.fov !== fov ||
    camera.near !== near ||
    camera.far !== far ||
    camera.aspect !== aspect
  ) {
    camera.fov = fov
    camera.near = near
    camera.far = far
    camera.aspect = aspect
    camera.updateProjectionMatrix()
  }
}
