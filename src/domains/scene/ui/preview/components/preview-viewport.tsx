import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import type { CameraEntity, PersonEntity, ShapeEntity, Vector2, WallSegment } from "@/domains/scene/core/types";
import { useSceneStore } from "../../state/scene-store";
import { TopDownPreview } from "./topdown-preview";

interface PreviewViewportProps {
  walls: WallSegment[];
  shapes: ShapeEntity[];
  cameras: CameraEntity[];
  people: PersonEntity[];
  selectedId: string | null;
  onPersonSelect: (id: string) => void;
  focus: Vector2;
  showMap: boolean;
  onCreated: (canvas: HTMLCanvasElement | null) => void;
}

function Floor({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200, 10, 10]} />
      <meshStandardMaterial color="#0b1224" wireframe opacity={0.1} transparent />
    </mesh>
  );
}

function WallsMesh({ walls }: { walls: WallSegment[] }) {
  return (
    <group>
      {walls.map((wall) => {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const length = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        return (
          <mesh key={wall.id} position={[wall.start.x + dx / 2, wall.height / 2, wall.start.y + dy / 2]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[length, wall.height, wall.thickness]} />
            <meshStandardMaterial color={wall.color} opacity={wall.opacity} transparent />
          </mesh>
        );
      })}
    </group>
  );
}

function ShapesMesh({ shapes }: { shapes: ShapeEntity[] }) {
  return (
    <group>
      {shapes.map((shape) => {
        if (shape.shape === "circle") {
          return (
            <mesh key={shape.id} position={[shape.position.x, shape.height / 2, shape.position.y]}>
              <cylinderGeometry args={[shape.radius ?? 1, shape.radius ?? 1, shape.height || 0.5, 24]} />
              <meshStandardMaterial color={shape.color} opacity={shape.opacity} transparent />
            </mesh>
          );
        }
        if (shape.shape === "rectangle") {
          return (
            <mesh key={shape.id} position={[shape.position.x, shape.height / 2, shape.position.y]} rotation={[0, (shape.rotation * Math.PI) / 180, 0]}>
              <boxGeometry args={[shape.width, shape.height || 0.5, shape.length]} />
              <meshStandardMaterial color={shape.color} opacity={shape.opacity} transparent />
            </mesh>
          );
        }
        if (shape.shape === "triangle") {
          return (
            <mesh key={shape.id} position={[shape.position.x, shape.height / 2, shape.position.y]} rotation={[0, (shape.rotation * Math.PI) / 180, 0]}>
              <coneGeometry args={[shape.width / 2, shape.height || 0.5, 3]} />
              <meshStandardMaterial color={shape.color} opacity={shape.opacity} transparent />
            </mesh>
          );
        }
        if (shape.shape === "line") {
          const len = shape.length;
          const angle = (shape.rotation ?? 0) * (Math.PI / 180);
          return (
            <mesh
              key={shape.id}
              position={[shape.position.x + (len / 2) * Math.cos(angle), (shape.height || 0.2) / 2, shape.position.y + (len / 2) * Math.sin(angle)]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[len, shape.height || 0.2, shape.lineThickness ?? 0.1]} />
              <meshStandardMaterial color={shape.color} opacity={shape.opacity} transparent />
            </mesh>
          );
        }
        return null;
      })}
    </group>
  );
}

function PeopleMesh({ people, selectedId }: { people: PersonEntity[]; selectedId: string | null }) {
  return (
    <group>
      {people.map((person) => (
        <group key={person.id} position={[person.position.x, person.radius, person.position.y]}>
          <mesh>
            <cylinderGeometry args={[person.radius, person.radius, person.height, 12]} />
            <meshStandardMaterial color={selectedId === person.id ? "#22c55e" : "#0ea5e9"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CamerasMesh({ cameras }: { cameras: CameraEntity[] }) {
  return (
    <group>
      {cameras.map((camera) => (
        <group key={camera.id} position={[camera.position.x, camera.height, camera.position.y]} rotation={[0, (camera.direction * Math.PI) / 180, 0]}>
          <mesh position={[0, 0, 0]}>
            <coneGeometry args={[0.2, 0.4, 6]} />
            <meshStandardMaterial color="#0ea5e9" />
          </mesh>
          <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[Math.tan((camera.fov / 2) * (Math.PI / 180)) * camera.depth, camera.depth, 24, 1, true]} />
            <meshStandardMaterial color="rgba(14,165,233,0.08)" transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function PreviewViewport({ walls, shapes, cameras, people, selectedId, onPersonSelect, focus, showMap, onCreated }: PreviewViewportProps) {
  const tick = useSceneStore((state) => state.tick);
  const previewMode = useSceneStore((state) => state.simulation.previewMode);
  useFrame((_, delta) => tick(delta * 1000));

  const scene = useMemo(
    () => (
      <>
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 10, 8]} intensity={0.7} />
        <Floor show={showMap} />
        <WallsMesh walls={walls} />
        <ShapesMesh shapes={shapes} />
        <CamerasMesh cameras={cameras} />
        <PeopleMesh people={people} selectedId={selectedId} />
        <OrbitControls enablePan enableZoom enableRotate target={[focus.x, 0.5, focus.y]} />
      </>
    ),
    [showMap, walls, shapes, cameras, people, selectedId, focus.x, focus.y]
  );

  if (previewMode === "2d") {
    return (
      <div className="h-full w-full bg-card">
        <TopDownPreview walls={walls} shapes={shapes} cameras={cameras} people={people} selectedId={selectedId} onPersonSelect={onPersonSelect} />
      </div>
    );
  }

  return (
    <Canvas
      shadows
      camera={{ position: [12, 12, 12], fov: 45, near: 0.1, far: 500 }}
      onCreated={({ gl }) => onCreated(gl.domElement as HTMLCanvasElement)}
      className="h-full w-full"
    >
      {scene}
    </Canvas>
  );
}
