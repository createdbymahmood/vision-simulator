import {OrbitControls, PerspectiveCamera} from '@react-three/drei'
import {Canvas, useFrame} from '@react-three/fiber'
import React, {useMemo, useState} from 'react'

import type {
  Scene,
  SceneCamera,
  ScenePerson,
  SceneShape,
  SceneWall,
} from '../../core/scene-types'

interface SimulationWorldProps {
  scene: Scene
  onSelectPerson: (id: string) => void
  selectedPersonId: string | null
  onReadySnapshot: (fn: () => string) => void
}

type PersonState = ScenePerson & {velocity: [number, number]; trail: number[][]}

const floorSize = 200
const gridDivisions = 40

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
          <boxGeometry args={[0.3, 0.2, 0.3]} />
          <meshStandardMaterial color='#0ea5e9' />
        </mesh>
        <mesh position={[0, 0, 0.45]}>
          <coneGeometry args={[0.12, 0.3, 12]} />
          <meshStandardMaterial color='#38bdf8' opacity={0.8} />
        </mesh>
      </group>
    ))}
  </>
)

const People: React.FC<{
  people: PersonState[]
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
          {person.trail.length > 1 && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  array={positions}
                  attach='attributes-position'
                  itemSize={3}
                  count={person.trail.length}
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
  people: ScenePerson[]
  obstacles: {x: number; y: number; width: number; length: number}[]
  selectedPersonId: string | null
  onSelect: (id: string) => void
}> = ({people, obstacles, selectedPersonId, onSelect}) => {
  const [state, setState] = useState<PersonState[]>(() =>
    people.map((person, index) => ({
      ...person,
      velocity: [Math.sin(index) * 0.5, Math.cos(index) * 0.5],
      trail: [],
    })),
  )

  const speed = 0.8

  const findAvoidingVelocity = (
    vx: number,
    vy: number,
    position: {x: number; y: number},
    radius: number,
  ) => {
    const candidates = [0, Math.PI / 2, -Math.PI / 2, Math.PI].map((delta) => {
      const angle = Math.atan2(vy, vx) + delta
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      }
    })

    const collides = (x: number, y: number) =>
      obstacles.some((obstacle) => {
        const minX = obstacle.x - radius
        const maxX = obstacle.x + obstacle.width + radius
        const minY = obstacle.y - radius
        const maxY = obstacle.y + obstacle.length + radius
        return x >= minX && x <= maxX && y >= minY && y <= maxY
      })

    const safe = candidates.find(
      (candidate) =>
        !collides(
          position.x + candidate.vx * 0.1,
          position.y + candidate.vy * 0.1,
        ),
    )
    return safe ?? {vx: -vx, vy: -vy}
  }

  useFrame((_, delta) => {
    setState((current) =>
      current.map((person, idx) => {
        const [vx, vy] = person.velocity
        const radius = person.radius || 0.3
        let nextVx = vx || speed
        let nextVy = vy || speed

        let nextX = person.x + nextVx * delta
        let nextY = person.y + nextVy * delta

        const colliding = obstacles.some((obstacle) => {
          const minX = obstacle.x - radius
          const maxX = obstacle.x + obstacle.width + radius
          const minY = obstacle.y - radius
          const maxY = obstacle.y + obstacle.length + radius
          return (
            nextX >= minX && nextX <= maxX && nextY >= minY && nextY <= maxY
          )
        })

        if (colliding) {
          const avoidance = findAvoidingVelocity(
            nextVx,
            nextVy,
            {x: person.x, y: person.y},
            radius,
          )
          nextVx = avoidance.vx
          nextVy = avoidance.vy
          nextX = person.x + nextVx * delta
          nextY = person.y + nextVy * delta
        }

        const newTrail = [...person.trail, [nextX, nextY, performance.now()]]
        const cutoff = performance.now() - 20000
        const trimmedTrail = newTrail.filter(([, , t]) => t >= cutoff)

        let newVx = vx
        let newVy = vy
        if ((idx + Math.random()) % 50 < 0.5) {
          newVx = nextVx
          newVy = nextVy
        }

        return {
          ...person,
          x: nextX,
          y: nextY,
          velocity: [newVx || speed, newVy || speed] as [number, number],
          trail: trimmedTrail,
        }
      }),
    )
  })

  return (
    <People
      onSelect={onSelect}
      people={state}
      selectedPersonId={selectedPersonId}
    />
  )
}

export const SimulationWorld: React.FC<SimulationWorldProps> = ({
  scene,
  onSelectPerson,
  selectedPersonId,
  onReadySnapshot,
}) => {
  const obstacles = useMemo(
    () =>
      [
        ...scene.shapes.map((shape) => ({
          x: shape.x,
          y: shape.y,
          width: shape.width,
          length: shape.length,
        })),
        ...scene.walls.map((wall) => ({
          x: Math.min(wall.coordinates.x1, wall.coordinates.x2),
          y: Math.min(wall.coordinates.y1, wall.coordinates.y2),
          width: Math.abs(wall.coordinates.x2 - wall.coordinates.x1),
          length: Math.abs(wall.coordinates.y2 - wall.coordinates.y1),
        })),
      ] as {x: number; y: number; width: number; length: number}[],
    [scene.shapes, scene.walls],
  )

  const handleSelectPerson = (id: string) => onSelectPerson(id)

  const handleCreated = (state: any) => {
    onReadySnapshot(() => state.gl.domElement.toDataURL('image/png'))
  }

  return (
    <Canvas
      dpr={[1, 2]}
      style={{width: '100%', height: '100%'}}
      onCreated={handleCreated}
      shadows
    >
      <ambientLight intensity={0.3} />
      <directionalLight intensity={0.8} position={[10, 15, 10]} />
      <PerspectiveCamera makeDefault position={[10, 10, 10]} />
      <gridHelper args={[floorSize, gridDivisions]} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[floorSize, floorSize]} />
        <meshStandardMaterial color='#e2e8f0' />
      </mesh>

      <Walls walls={scene.walls} />
      <Shapes shapes={scene.shapes} />
      <Cameras cameras={scene.cameras} />
      <PeopleSimulation
        obstacles={obstacles}
        onSelect={handleSelectPerson}
        people={scene.people}
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
