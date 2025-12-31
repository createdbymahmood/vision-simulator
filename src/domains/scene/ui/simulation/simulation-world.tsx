import type {ExtrudeGeometry} from 'three'

import {OrbitControls, PerspectiveCamera} from '@react-three/drei'
import {Canvas} from '@react-three/fiber'
import React, {useMemo, useRef} from 'react'
import {Color, DoubleSide, Shape} from 'three'

import type {
  Scene,
  SceneCamera,
  SceneShape,
  SceneWall,
} from '../../core/scene-types'
import type {CanvasPoint} from '../canvas-editor/types'
import type {MovingPerson} from './people-movement'
import type {CameraVision} from './types'

interface SimulationWorldProps {
  scene: Scene
  cameraVisions: CameraVision[]
  people: MovingPerson[]
  onSelectPerson: (id: string) => void
  selectedPersonId: string | null
  onReadySnapshot: (fn: () => Promise<string>) => void
}

const floorSize = 200
const gridDivisions = 40

const buildShapeFromPoints = (points: CanvasPoint[]) => {
  const sanitized = points.filter(
    (point) =>
      point &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y),
  )
  if (sanitized.length < 3) {
    return null
  }
  const shape = new Shape()
  shape.moveTo(sanitized[0]!.x, -sanitized[0]!.y)
  sanitized.slice(1).forEach((point) => shape.lineTo(point.x, -point.y))
  shape.closePath()
  return shape
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
              args={[shape.width / 2, shape.width / 2, shape.height || 1, 32]}
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

const Cameras: React.FC<{cameras: SceneCamera[]}> = ({cameras}) => (
  <>
    {cameras.map((camera) => (
      <group
        key={camera.id}
        position={[camera.x, camera.height, camera.y]}
        rotation={[0, (camera.direction * Math.PI) / 180, 0]}
      >
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.35, 0.25, 0.35]} />
          <meshStandardMaterial color='#0ea5e9' />
        </mesh>
      </group>
    ))}
  </>
)

const CameraFovMesh: React.FC<{vision: CameraVision}> = ({vision}) => {
  const shape = useMemo(
    () => buildShapeFromPoints(vision.points),
    [vision.points],
  )

  if (!shape) {
    return null
  }

  const depth = Math.max(vision.height, 0.2)

  return (
    <mesh key={vision.id} position={[0, 0, 0]}>
      <extrudeGeometry
        args={[shape, {depth, bevelEnabled: false}]}
        attach='geometry'
        onUpdate={(geometry: ExtrudeGeometry) => {
          if (!geometry.userData.rotated) {
            geometry.rotateX(-Math.PI / 2)
            geometry.userData.rotated = true
          }
          geometry.computeVertexNormals()
        }}
      />
      <meshStandardMaterial
        transparent
        depthWrite={false}
        side={DoubleSide}
        color='#38bdf8'
        opacity={0.28}
      />
    </mesh>
  )
}

const CameraFovs: React.FC<{visions: CameraVision[]}> = ({visions}) => (
  <>
    {visions.map((vision) => (
      <CameraFovMesh key={vision.id} vision={vision} />
    ))}
  </>
)

const People: React.FC<{
  people: MovingPerson[]
  selectedPersonId: string | null
  onSelect: (id: string) => void
}> = ({people, selectedPersonId, onSelect}) => (
  <>
    {people.map((person) => {
      const handlePointerDown = () => onSelect(person.id)
      const positions = new Float32Array(person.trail.length * 3)
      person.trail.forEach((point, index) => {
        positions[index * 3] = point[0]
        positions[index * 3 + 1] = 0.05
        positions[index * 3 + 2] = point[1]
      })
      return (
        <group
          key={person.id}
          position={[person.x, person.height / 2, person.y]}
        >
          <mesh onPointerDown={handlePointerDown}>
            <cylinderGeometry
              args={[person.radius, person.radius, person.height, 12]}
            />
            <meshStandardMaterial
              color={selectedPersonId === person.id ? '#22c55e' : '#16a34a'}
            />
          </mesh>
          <mesh position={[0, person.height / 2, 0]}>
            <sphereGeometry args={[person.radius * 0.75, 12, 12]} />
            <meshStandardMaterial color='#16a34a' />
          </mesh>
          {person.trail.length > 1 && person.trailEnabled && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  args={[positions, 3]}
                  attach='attributes-position'
                />
              </bufferGeometry>
              <lineBasicMaterial color='#22c55e' />
            </line>
          )}
        </group>
      )
    })}
  </>
)

const PeopleSimulation: React.FC<{
  people: MovingPerson[]
  selectedPersonId: string | null
  onSelect: (id: string) => void
}> = ({people, selectedPersonId, onSelect}) => (
  <People
    onSelect={onSelect}
    people={people}
    selectedPersonId={selectedPersonId}
  />
)

export const SimulationWorld: React.FC<SimulationWorldProps> = ({
  scene,
  cameraVisions,
  people,
  onSelectPerson,
  selectedPersonId,
  onReadySnapshot,
}) => {
  const handleSelectPerson = (id: string) => onSelectPerson(id)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gridVisibleRef = useRef(true)

  const handleCreated = (state: any) => {
    canvasRef.current = state.gl.domElement
    const gridHelper = state.scene.children.find(
      (child: any) => child.type === 'GridHelper',
    )
    const prevAlpha = state.gl.getClearAlpha()
    const prevColor = state.gl.getClearColor(new Color())
    onReadySnapshot(async () => {
      if (gridHelper && gridVisibleRef.current) {
        gridHelper.visible = false
      }
      state.gl.setClearAlpha(0)
      state.gl.setClearColor('#000000', 0)
      state.gl.render(state.scene, state.camera)
      const dataUrl = state.gl.domElement.toDataURL('image/png')
      if (gridHelper && gridVisibleRef.current) {
        gridHelper.visible = true
      }
      state.gl.setClearAlpha(prevAlpha)
      state.gl.setClearColor(prevColor, prevAlpha)
      return dataUrl
    })
  }

  return (
    <Canvas
      dpr={[1, 2]}
      ref={canvasRef}
      style={{width: '100%', height: '100%'}}
      onCreated={handleCreated}
      shadows
    >
      <ambientLight intensity={0.3} />
      <directionalLight intensity={0.8} position={[10, 15, 10]} />
      <PerspectiveCamera makeDefault position={[10, 10, 10]} />
      <gridHelper
        args={[floorSize, gridDivisions, '#e2e8f0', '#e2e8f0']}
        position={[0, 0.01, 0]}
      />
      <mesh
        position={[0, -0.01, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[floorSize, floorSize]} />
        <meshStandardMaterial color='#e2e8f0' />
      </mesh>

      <Walls walls={scene.walls} />
      <Shapes shapes={scene.shapes} />
      <CameraFovs visions={cameraVisions} />
      <Cameras cameras={scene.cameras} />
      <PeopleSimulation
        onSelect={handleSelectPerson}
        people={people}
        selectedPersonId={selectedPersonId}
      />
      <OrbitControls
        enableDamping
        enablePan
        maxDistance={200}
        minDistance={2}
        dampingFactor={0.1}
        enableZoom
      />
    </Canvas>
  )
}

SimulationWorld.displayName = 'simulation-world'
