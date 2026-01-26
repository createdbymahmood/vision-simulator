import React from 'react'
import type {CameraEntity, SceneRoot} from '@/features/scene/domain/types'
import type {CoordinateTransformer} from './simulation-helpers'
import * as THREE from 'three'

import {
  buildFovOcclusionObstacles,
  buildOccludedFovRing,
} from '@/features/scene/presentation/components/map-view/map-view-helpers'

interface FovFootprintMeshProps {
  points: THREE.Vector3[]
  color: string
}

const FovFootprintMesh: React.FC<FovFootprintMeshProps> = ({points, color}) => {
  const groundOffset = 0.02

  const lineRef = React.useRef<THREE.LineSegments | null>(null)

  const {surfaceGeometry, lineGeometry} = React.useMemo(() => {
    if (points.length < 3) {
      return {surfaceGeometry: null, lineGeometry: null}
    }
    const shape = new THREE.Shape()
    points.forEach((point, index) => {
      if (index === 0) {
        shape.moveTo(point.x, point.z)
      } else {
        shape.lineTo(point.x, point.z)
      }
    })
    const surface = new THREE.ShapeGeometry(shape)
    surface.rotateX(-Math.PI / 2)

    const linePoints = points.map(
      (point) => new THREE.Vector3(point.x, groundOffset, point.z),
    )
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints)
    return {surfaceGeometry: surface, lineGeometry}
  }, [points])

  React.useEffect(() => {
    return () => {
      surfaceGeometry?.dispose()
      lineGeometry?.dispose()
    }
  }, [lineGeometry, surfaceGeometry])

  React.useEffect(() => {
    if (lineRef.current) {
      lineRef.current.computeLineDistances()
    }
  }, [lineGeometry])

  if (!surfaceGeometry || !lineGeometry) {
    return null
  }

  return (
    <group>
      <mesh geometry={surfaceGeometry} position={[0, groundOffset, 0]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>
      <lineSegments
        ref={lineRef}
        geometry={lineGeometry}
        position={[0, 0.001, 0]}
      >
        <lineDashedMaterial
          color={color}
          transparent
          opacity={0.9}
          dashSize={0.6}
          gapSize={0.6}
        />
      </lineSegments>
    </group>
  )
}

interface CameraFovFootprintsProps {
  cameras: CameraEntity[]
  scene: SceneRoot
  transformer: CoordinateTransformer
}

export const CameraFovFootprints: React.FC<CameraFovFootprintsProps> = ({
  cameras,
  scene,
  transformer,
}) => {
  const obstaclesByArea = React.useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildFovOcclusionObstacles>>()
    scene.areas.forEach((area) => {
      const areaWalls = scene.walls.filter((wall) => wall.areaId === area.id)
      const areaShapes = scene.shapes.filter((shape) => shape.areaId === area.id)
      map.set(area.id, buildFovOcclusionObstacles(areaWalls, areaShapes))
    })
    return map
  }, [scene.areas, scene.shapes, scene.walls])

  const footprints = React.useMemo(() => {
    return cameras.map((camera) => {
      const origin: [number, number] = [camera.x, camera.y]
      const effectivePan = camera.ptz?.pan ?? camera.direction
      const effectiveFov = camera.fov / Math.max(camera.ptz?.zoom ?? 1, 0.0001)
      const area = scene.areas.find((item) => item.id === camera.areaId)
      const obstacles = area
        ? obstaclesByArea.get(area.id) ?? []
        : []
      const ring = buildOccludedFovRing({
        origin,
        direction: effectivePan,
        fov: effectiveFov,
        depth: camera.depth,
        cameraHeight: camera.height,
        area,
        obstacles,
      })
      const points = ring.map((point) => transformer.toVector3(point, 0))
      return {id: camera.id, color: camera.color, points}
    })
  }, [cameras, obstaclesByArea, scene.areas, transformer])

  return (
    <>
      {footprints.map((footprint) => (
        <FovFootprintMesh
          key={footprint.id}
          color={footprint.color}
          points={footprint.points}
        />
      ))}
    </>
  )
}
