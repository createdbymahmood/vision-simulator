import type {CameraEntity} from '@/features/scene/domain/types'

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const degToRad = (deg: number) => (deg * Math.PI) / 180

export const buildFovRing = ({
  camera,
  origin,
  segments = 20,
}: {
  camera: CameraEntity
  origin: {x: number; z: number}
  segments?: number
}) => {
  const yaw = -(degToRad(camera.ptz?.pan ?? camera.direction))
  const fov = degToRad(camera.fov / Math.max(camera.ptz?.zoom ?? 1, 0.0001))
  const halfFov = fov / 2
  const start = yaw - halfFov
  const step = fov / segments
  const points: {x: number; z: number}[] = []
  for (let i = 0; i <= segments; i += 1) {
    const angle = start + step * i
    const dx = Math.sin(angle)
    const dz = -Math.cos(angle)
    points.push({
      x: origin.x + dx * camera.depth,
      z: origin.z + dz * camera.depth,
    })
  }
  return points
}
