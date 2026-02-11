import React from 'react'
import * as THREE from 'three'

import type {CameraEntity, SceneRoot} from '@/features/scene/domain/types'

import {
  buildFovOcclusionObstacles,
  buildOccludedFovRing,
} from '@/features/scene/presentation/components/map-view/map-view-helpers'

import type {CoordinateTransformer} from './simulation-helpers'

import {getCameraOpticHeight} from './camera-collision-utils'

interface FovFootprintMeshProps {
  points: THREE.Vector3[]
  apex: THREE.Vector3
  color: string
  renderOrderBase: number
}

const POINT_MATCH_EPSILON = 1e-8

const sanitizeGroundContour = (points: THREE.Vector3[]) => {
  if (points.length === 0) {
    return []
  }
  const contour: THREE.Vector3[] = []
  points.forEach((point) => {
    const last = contour[contour.length - 1]
    if (!last || last.distanceToSquared(point) > POINT_MATCH_EPSILON) {
      contour.push(point.clone())
    }
  })
  if (
    contour.length > 1 &&
    contour[0].distanceToSquared(contour[contour.length - 1]) <=
      POINT_MATCH_EPSILON
  ) {
    contour.pop()
  }
  return contour
}

// eslint-disable-next-line max-lines-per-function
const FovFootprintMesh: React.FC<FovFootprintMeshProps> = ({
  points,
  apex,
  color,
  renderOrderBase,
}) => {
  const groundOffset = 0.03

  const lineRef = React.useRef<THREE.LineSegments | null>(null)

  const {surfaceGeometry, lineGeometry, volumeGeometry, volumeEdgeGeometry} =
    React.useMemo(() => {
      const contour = sanitizeGroundContour(points)
      if (contour.length < 3) {
        return {
          surfaceGeometry: null,
          lineGeometry: null,
          volumeGeometry: null,
          volumeEdgeGeometry: null,
        }
      }
      const shape = new THREE.Shape()
      contour.forEach((point, index) => {
        const projectedY = -point.z
        if (index === 0) {
          shape.moveTo(point.x, projectedY)
        } else {
          shape.lineTo(point.x, projectedY)
        }
      })
      const surface = new THREE.ShapeGeometry(shape)
      surface.rotateX(-Math.PI / 2)

      const linePoints: THREE.Vector3[] = []
      for (let index = 0; index < contour.length; index += 1) {
        const start = contour[index]
        const end = contour[(index + 1) % contour.length]
        linePoints.push(
          new THREE.Vector3(start.x, groundOffset, start.z),
          new THREE.Vector3(end.x, groundOffset, end.z),
        )
      }
      const outlineGeometry = new THREE.BufferGeometry().setFromPoints(
        linePoints,
      )

      const volumePositions = new Float32Array((contour.length + 1) * 3)
      volumePositions[0] = apex.x
      volumePositions[1] = apex.y
      volumePositions[2] = apex.z
      contour.forEach((point, index) => {
        const base = (index + 1) * 3
        volumePositions[base] = point.x
        volumePositions[base + 1] = point.y + groundOffset * 0.5
        volumePositions[base + 2] = point.z
      })
      const volumeIndices: number[] = []
      for (let index = 0; index < contour.length; index += 1) {
        const current = index + 1
        const next = ((index + 1) % contour.length) + 1
        volumeIndices.push(0, current, next)
      }
      const volume = new THREE.BufferGeometry()
      volume.setAttribute(
        'position',
        new THREE.BufferAttribute(volumePositions, 3),
      )
      volume.setIndex(volumeIndices)
      volume.computeVertexNormals()

      const edgePoints: THREE.Vector3[] = []
      contour.forEach((point) => {
        edgePoints.push(apex.clone(), point.clone())
      })
      const volumeEdges = new THREE.BufferGeometry().setFromPoints(edgePoints)

      return {
        surfaceGeometry: surface,
        lineGeometry: outlineGeometry,
        volumeGeometry: volume,
        volumeEdgeGeometry: volumeEdges,
      }
    }, [apex, points])

  React.useEffect(() => {
    return () => {
      surfaceGeometry?.dispose()
      lineGeometry?.dispose()
      volumeGeometry?.dispose()
      volumeEdgeGeometry?.dispose()
    }
  }, [lineGeometry, surfaceGeometry, volumeEdgeGeometry, volumeGeometry])

  React.useEffect(() => {
    if (lineRef.current) {
      lineRef.current.computeLineDistances()
    }
  }, [lineGeometry])

  if (
    !surfaceGeometry ||
    !lineGeometry ||
    !volumeGeometry ||
    !volumeEdgeGeometry
  ) {
    return null
  }

  return (
    <group>
      <mesh renderOrder={renderOrderBase} geometry={volumeGeometry}>
        <meshBasicMaterial
          transparent
          blending={THREE.NormalBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          color={color}
          opacity={0.14}
          toneMapped={false}
        />
      </mesh>
      <lineSegments
        renderOrder={renderOrderBase + 1}
        geometry={volumeEdgeGeometry}
      >
        <lineBasicMaterial
          transparent
          depthWrite={false}
          color={color}
          opacity={0.35}
          toneMapped={false}
        />
      </lineSegments>
      <mesh
        renderOrder={renderOrderBase + 2}
        geometry={surfaceGeometry}
        position={[0, groundOffset, 0]}
      >
        <meshBasicMaterial
          transparent
          depthTest={false}
          depthWrite={false}
          side={THREE.DoubleSide}
          color={color}
          opacity={0.2}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
          toneMapped={false}
        />
      </mesh>
      <lineSegments
        ref={lineRef}
        renderOrder={renderOrderBase + 3}
        geometry={lineGeometry}
        position={[0, 0.002, 0]}
      >
        <lineDashedMaterial
          transparent
          dashSize={0.6}
          depthTest={false}
          depthWrite={false}
          gapSize={0.6}
          color={color}
          opacity={1}
          toneMapped={false}
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
      const areaShapes = scene.shapes.filter(
        (shape) => shape.areaId === area.id,
      )
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
      const obstacles = area ? (obstaclesByArea.get(area.id) ?? []) : []
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
      const apex = transformer.toVector3(origin, getCameraOpticHeight(camera))
      return {id: camera.id, color: camera.color, points, apex}
    })
  }, [cameras, obstaclesByArea, scene.areas, transformer])

  return (
    <>
      {footprints.map((footprint, index) => (
        <FovFootprintMesh
          apex={footprint.apex}
          key={footprint.id}
          renderOrderBase={160 + index * 4}
          color={footprint.color}
          points={footprint.points}
        />
      ))}
    </>
  )
}
