import type {PerspectiveCamera as ThreePerspectiveCamera} from 'three'

import {PerspectiveCamera} from '@react-three/drei'
import {Canvas, useFrame, useThree} from '@react-three/fiber'
import React, {useEffect, useMemo, useRef, useState} from 'react'
import {Color, Vector3} from 'three'

import type {SceneCamera, SceneShape, SceneWall} from '../../core/scene-types'
import type {MovingPerson} from './people-movement'
import type {CameraVision} from './types'

import {useElementSize} from '../canvas-editor/hooks'

interface BoundingBox2d {
  id: string
  x: number
  y: number
  width: number
  height: number
}

interface CameraFeedProps {
  camera: SceneCamera
  walls: SceneWall[]
  shapes: SceneShape[]
  people: MovingPerson[]
  vision: CameraVision
  selectedPersonId: string | null
  onSelectPerson?: (id: string) => void
}

const Walls: React.FC<{walls: SceneWall[]}> = ({walls}) => (
  <>
    {walls.map((wall) => {
      const dx = wall.coordinates.x2 - wall.coordinates.x1
      const dy = wall.coordinates.y2 - wall.coordinates.y1
      const length = Math.sqrt(dx * dx + dy * dy)
      const rotation = Math.atan2(dy, dx)
      const midX = (wall.coordinates.x1 + wall.coordinates.x2) / 2
      const midY = (wall.coordinates.y1 + wall.coordinates.y2) / 2
      return (
        <mesh
          key={wall.id}
          position={[midX, wall.height / 2, midY]}
          rotation={[0, -rotation, 0]}
        >
          <boxGeometry args={[length, wall.height, wall.thickness]} />
          <meshStandardMaterial color={wall.color} opacity={wall.opacity} />
        </mesh>
      )
    })}
  </>
)

const Shapes: React.FC<{shapes: SceneShape[]}> = ({shapes}) => (
  <>
    {shapes.map((shape) => {
      if (shape.type === 'circle') {
        return (
          <mesh
            key={shape.id}
            position={[
              shape.x + shape.width / 2,
              shape.height / 2,
              shape.y + shape.length / 2,
            ]}
            rotation={[0, shape.rotation, 0]}
          >
            <cylinderGeometry
              args={[shape.width / 2, shape.width / 2, shape.height || 1, 24]}
            />
            <meshStandardMaterial color={shape.color} opacity={shape.opacity} />
          </mesh>
        )
      }
      return (
        <mesh
          key={shape.id}
          position={[
            shape.x + shape.width / 2,
            shape.height / 2,
            shape.y + shape.length / 2,
          ]}
          rotation={[0, shape.rotation, 0]}
        >
          <boxGeometry args={[shape.width, shape.height || 1, shape.length]} />
          <meshStandardMaterial color={shape.color} opacity={shape.opacity} />
        </mesh>
      )
    })}
  </>
)

const PeopleMeshes: React.FC<{
  people: MovingPerson[]
  selectedPersonId: string | null
  onSelectPerson?: (id: string) => void
}> = ({people, selectedPersonId, onSelectPerson}) => (
  <>
    {people.map((person) => {
      const handlePointerDown = () => onSelectPerson?.(person.id)
      const color = selectedPersonId === person.id ? '#22c55e' : '#16a34a'
      return (
        <group
          key={person.id}
          onPointerDown={handlePointerDown}
          position={[person.x, person.height / 2, person.y]}
        >
          <mesh>
            <cylinderGeometry
              args={[person.radius, person.radius, person.height, 12]}
            />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, person.height / 2, 0]}>
            <sphereGeometry args={[person.radius * 0.75, 12, 12]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      )
    })}
  </>
)

const projectToScreen = (
  camera: ThreePerspectiveCamera,
  point: Vector3,
  width: number,
  height: number,
) => {
  const projected = point.clone().project(camera)
  return {
    x: ((projected.x + 1) / 2) * width,
    y: ((1 - projected.y) / 2) * height,
  }
}

const computeBoundingBoxes = (
  camera: ThreePerspectiveCamera,
  width: number,
  height: number,
  vision: CameraVision,
): BoundingBox2d[] => {
  if (!width || !height) {
    return []
  }
  return vision.visiblePeople
    .filter((person) => person.visible)
    .map((person) => {
      const radius = Math.max(person.radius, 0.1)
      const corners = [
        new Vector3(person.center.x - radius, 0, person.center.y - radius),
        new Vector3(person.center.x + radius, 0, person.center.y - radius),
        new Vector3(person.center.x + radius, 0, person.center.y + radius),
        new Vector3(person.center.x - radius, 0, person.center.y + radius),
        new Vector3(
          person.center.x - radius,
          person.height,
          person.center.y - radius,
        ),
        new Vector3(
          person.center.x + radius,
          person.height,
          person.center.y - radius,
        ),
        new Vector3(
          person.center.x + radius,
          person.height,
          person.center.y + radius,
        ),
        new Vector3(
          person.center.x - radius,
          person.height,
          person.center.y + radius,
        ),
      ]
      const projections = corners.map((corner) =>
        projectToScreen(camera, corner, width, height),
      )
      const xs = projections.map((p) => p.x)
      const ys = projections.map((p) => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      return {
        id: person.id,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      }
    })
    .filter((box) => box.width > 1 && box.height > 1)
}

interface SceneProps {
  cameraConfig: SceneCamera
  walls: SceneWall[]
  shapes: SceneShape[]
  people: MovingPerson[]
  vision: CameraVision
  viewportSize: {width: number; height: number}
  onBoxes: (boxes: BoundingBox2d[]) => void
  selectedPersonId: string | null
  onSelectPerson?: (id: string) => void
}

const CameraFeedScene: React.FC<SceneProps> = ({
  cameraConfig,
  walls,
  shapes,
  people,
  vision,
  viewportSize,
  onBoxes,
  selectedPersonId,
  onSelectPerson,
}) => {
  const cameraRef = useRef<ThreePerspectiveCamera | null>(null)
  const frameCount = useRef(0)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const interval = window.setInterval(() => invalidate(), 120)
    return () => window.clearInterval(interval)
  }, [invalidate])

  useFrame(({size}) => {
    const camera = cameraRef.current
    if (!camera) return

    const yaw = (cameraConfig.direction * Math.PI) / 180
    const targetDistance = Math.max(cameraConfig.depth, 4)
    // Limit preview FOV to avoid extreme distortion/blank frames at ultra-wide angles.
    const displayFov = Math.min(cameraConfig.fov, 130)
    camera.fov = displayFov
    camera.near = Math.max(cameraConfig.nearPlane ?? 0.1, 0.05)
    camera.far = Math.max(cameraConfig.depth + 10, 120)
    camera.aspect =
      viewportSize.width && viewportSize.height
        ? viewportSize.width / viewportSize.height
        : size.width / Math.max(size.height, 1)
    camera.position.set(cameraConfig.x, cameraConfig.height, cameraConfig.y)
    const lookAtHeight = Math.max(cameraConfig.height * 0.25, 0.5)
    const lookAt = new Vector3(
      cameraConfig.x + Math.cos(yaw) * targetDistance,
      lookAtHeight,
      cameraConfig.y + Math.sin(yaw) * targetDistance,
    )
    camera.lookAt(lookAt)
    camera.updateProjectionMatrix()

    frameCount.current += 1
    if (frameCount.current % 2 !== 0) {
      return
    }
    const boxes = computeBoundingBoxes(
      camera,
      viewportSize.width || size.width,
      viewportSize.height || size.height,
      vision,
    )
    onBoxes(boxes)
  })

  const background = useMemo(() => new Color('#f8fafc'), [])

  return (
    <>
      <fog args={['#dce3ec', 40, 140]} attach='fog' />
      <color args={[background]} attach='background' />
      <PerspectiveCamera makeDefault ref={cameraRef} />
      <ambientLight intensity={0.35} />
      <directionalLight intensity={0.9} position={[8, 12, 10]} />
      <mesh
        position={[0, -0.01, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color='#d7dce3' />
      </mesh>
      <Walls walls={walls} />
      <Shapes shapes={shapes} />
      <PeopleMeshes
        onSelectPerson={onSelectPerson}
        people={people}
        selectedPersonId={selectedPersonId}
      />
    </>
  )
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  camera,
  walls,
  shapes,
  people,
  vision,
  selectedPersonId,
  onSelectPerson,
}) => {
  const [containerRef, size] = useElementSize<HTMLDivElement>()
  const [boxes, setBoxes] = useState<BoundingBox2d[]>([])

  return (
    <div className='relative h-full w-full' ref={containerRef}>
      <div className='h-full w-full overflow-hidden bg-muted'>
        <Canvas
          dpr={[1, 1.5]}
          gl={{antialias: false}}
          style={{width: '100%', height: '100%'}}
          frameloop='demand'
          shadows={false}
        >
          <CameraFeedScene
            shapes={shapes}
            walls={walls}
            cameraConfig={camera}
            onBoxes={setBoxes}
            onSelectPerson={onSelectPerson}
            people={people}
            selectedPersonId={selectedPersonId}
            viewportSize={size}
            vision={vision}
          />
        </Canvas>
      </div>
      <svg className='pointer-events-none absolute left-0 top-0 h-full w-full'>
        {boxes.map((box) => {
          const isSelected = selectedPersonId === box.id
          const strokeColor = isSelected ? '#a855f7' : '#22c55e'
          return (
            <rect
              height={box.height}
              width={box.width}
              fill='none'
              key={box.id}
              x={box.x}
              y={box.y}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2.25 : 1.5}
            />
          )
        })}
      </svg>
    </div>
  )
}

CameraFeed.displayName = 'camera-feed'
