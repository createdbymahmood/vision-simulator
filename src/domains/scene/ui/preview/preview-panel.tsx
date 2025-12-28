import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import type { CameraEntity, PersonEntity, ShapeEntity, Vector2, WallSegment } from "../../core/types";
import { useSceneStore } from "../state/scene-store";
import { Camera, CirclePlay, Square, MonitorSmartphone } from "lucide-react";

interface PreviewMeshProps {
  walls: WallSegment[];
  shapes: ShapeEntity[];
  cameras: CameraEntity[];
  people: PersonEntity[];
  selectedId: string | null;
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

function centroidOfArea(points: Vector2[]): Vector2 {
  if (!points.length) return { x: 0, y: 0 };
  const sum = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
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
            <mesh
              key={shape.id}
              position={[shape.position.x, shape.height / 2, shape.position.y]}
              rotation={[0, (shape.rotation * Math.PI) / 180, 0]}
            >
              <boxGeometry args={[shape.width, shape.height || 0.5, shape.length]} />
              <meshStandardMaterial color={shape.color} opacity={shape.opacity} transparent />
            </mesh>
          );
        }
        if (shape.shape === "triangle") {
          return (
            <mesh
              key={shape.id}
              position={[shape.position.x, shape.height / 2, shape.position.y]}
              rotation={[0, (shape.rotation * Math.PI) / 180, 0]}
            >
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

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200, 10, 10]} />
      <meshStandardMaterial color="#0b1224" wireframe opacity={0.1} transparent />
    </mesh>
  );
}

function PreviewScene({ walls, shapes, cameras, people, selectedId, focus, showMap }: PreviewMeshProps & { focus: Vector2; showMap: boolean }) {
  const tick = useSceneStore((state) => state.tick);
  const { gl } = useThree();
  useFrame((_, delta) => {
    tick(delta * 1000);
  });

  useEffect(() => {
    gl.setClearColor("#0a0f1c");
  }, [gl]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 10, 8]} intensity={0.7} />
      {showMap ? <Floor /> : null}
      <WallsMesh walls={walls} />
      <ShapesMesh shapes={shapes} />
      <CamerasMesh cameras={cameras} />
      <PeopleMesh people={people} selectedId={selectedId} />
      <OrbitControls enablePan enableZoom enableRotate target={[focus.x, 0.5, focus.y]} />
    </>
  );
}

function TopDownPreview({
  walls,
  shapes,
  cameras,
  people,
  selectedId,
  onPersonSelect,
}: PreviewMeshProps & { onPersonSelect?: (id: string) => void }) {
  const width = 480;
  const height = 320;
  const toCanvas = (point: Vector2) => ({ x: width / 2 + point.x * 12, y: height / 2 + point.y * 12 });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={width} height={height} fill="url(#grid)" />
      {walls.map((wall) => {
        const s = toCanvas(wall.start);
        const e = toCanvas(wall.end);
        return <line key={wall.id} x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#0f172a" strokeWidth={wall.thickness * 8} />;
      })}
      {shapes.map((shape) => {
        const pos = toCanvas(shape.position);
        if (shape.shape === "circle") {
          return <circle key={shape.id} cx={pos.x} cy={pos.y} r={(shape.radius ?? 1) * 12} fill="#22c55e20" stroke="#22c55e" />;
        }
        if (shape.shape === "rectangle") {
          return (
            <rect
              key={shape.id}
              x={pos.x - (shape.width * 12) / 2}
              y={pos.y - (shape.length * 12) / 2}
              width={shape.width * 12}
              height={shape.length * 12}
              fill="#22c55e20"
              stroke="#22c55e"
            />
          );
        }
        return null;
      })}
      {cameras.map((camera) => {
        const pos = toCanvas(camera.position);
        const coneEnd = toCanvas({ x: camera.position.x + Math.cos((camera.direction * Math.PI) / 180) * camera.depth, y: camera.position.y + Math.sin((camera.direction * Math.PI) / 180) * camera.depth });
        return (
          <g key={camera.id}>
            <circle cx={pos.x} cy={pos.y} r={8} fill="#0ea5e9" />
            <line x1={pos.x} y1={pos.y} x2={coneEnd.x} y2={coneEnd.y} stroke="#0ea5e9" strokeWidth={1} />
          </g>
        );
      })}
      {selectedId
        ? people
            .find((person) => person.id === selectedId)
            ?.trail?.map((point, idx, arr) => {
              if (idx === arr.length - 1) return null;
              const a = toCanvas(point);
              const b = toCanvas(arr[idx + 1]);
              return <line key={`${selectedId}-trail-${idx}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#22c55e" strokeWidth={2} opacity={0.6} />;
            })
        : null}
      {people.map((person) => {
        const pos = toCanvas(person.position);
        return (
          <circle
            key={person.id}
            cx={pos.x}
            cy={pos.y}
            r={person.radius * 12}
            fill={selectedId === person.id ? "#22c55e" : "#0ea5e9"}
            opacity={0.8}
            onClick={() => onPersonSelect?.(person.id)}
            style={{ cursor: onPersonSelect ? "pointer" : "default" }}
          />
        );
      })}
    </svg>
  );
}

export function PreviewPanel() {
  const { push } = useToast();
  const cameras = useSceneStore((state) => state.cameras);
  const areas = useSceneStore((state) => state.areas);
  const walls = useSceneStore((state) => state.walls);
  const shapes = useSceneStore((state) => state.shapes);
  const people = useSceneStore((state) => state.people);
  const mode = useSceneStore((state) => state.mode);
  const play = useSceneStore((state) => state.simulation.playing);
  const playAction = useSceneStore((state) => state.play);
  const pauseAction = useSceneStore((state) => state.pause);
  const setPreviewMode = useSceneStore((state) => state.setSimulationPreviewMode);
  const previewMode = useSceneStore((state) => state.simulation.previewMode);
  const selection = useSceneStore((state) => state.selected);
  const setSelection = useSceneStore((state) => state.setSelection);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [focus, setFocus] = useState<Vector2>({ x: 0, y: 0 });
  const [showMap, setShowMap] = useState(true);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const selectedId = selection && "id" in selection ? selection.id : null;

  const startRecording = useCallbackRef(() => {
    if (!canvasEl) return;
    const stream = (canvasEl as HTMLCanvasElement).captureStream(60);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "recording.webm";
      anchor.click();
      URL.revokeObjectURL(url);
    };
    recorder.start();
    recorderRef.current = recorder;
    push({ title: "Recording started", description: "Capture of main viewport running." });
  });

  const stopRecording = useCallbackRef(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    push({ title: "Recording finished", description: "Saved WebM clip." });
  });

  const snapshot = useCallbackRef(() => {
    if (!canvasEl) return;
    const data = canvasEl.toDataURL("image/png", 1.0);
    const anchor = document.createElement("a");
    anchor.href = data;
    anchor.download = "snapshot.png";
    anchor.click();
    push({ title: "Snapshot exported", description: "PNG saved." });
  });

  const togglePlay = () => {
    if (play) pauseAction();
    else playAction();
  };

  const cameraFeeds = useMemo(
    () =>
      cameras.map((camera) => ({
        id: camera.id,
        label: `Cam ${camera.typePreset}`,
        detections: camera.detections,
      })),
    [cameras]
  );

  return (
    <div className="grid h-full grid-cols-[2fr_1fr] gap-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Simulation</Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={play} onChange={togglePlay} /> {play ? "Playing" : "Paused"}
            </div>
            <div className="flex items-center gap-2">
              <Button variant={previewMode === "3d" ? "default" : "ghost"} size="sm" onClick={() => setPreviewMode("3d")}>3D</Button>
              <Button variant={previewMode === "2d" ? "default" : "ghost"} size="sm" onClick={() => setPreviewMode("2d")}>2D</Button>
            </div>
            {mode === "map" ? (
              <div className="flex items-center gap-2">
                <select
                  className="rounded-lg border border-border bg-card px-2 py-1 text-xs"
                  onChange={(event) => {
                    const area = areas.find((item) => item.id === event.target.value);
                    if (area) {
                      setSelection({ kind: "area", id: area.id });
                      setFocus(centroidOfArea(area.geometry.points));
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">Area focus</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Switch checked={showMap} onChange={(event) => setShowMap(event.target.checked)} /> Map view
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={snapshot}>
              <Camera className="mr-1 h-4 w-4" /> Snapshot
            </Button>
            <Button variant="secondary" size="sm" onClick={() => (recorderRef.current ? stopRecording() : startRecording())}>
              {recorderRef.current ? <Square className="mr-1 h-4 w-4" /> : <CirclePlay className="mr-1 h-4 w-4" />} {recorderRef.current ? "Stop" : "Record"}
            </Button>
          </div>
        </div>

        <div className="relative min-h-[60vh] overflow-hidden rounded-3xl border border-border/70 bg-card/60">
          {previewMode === "3d" ? (
            <Canvas
              shadows
              camera={{ position: [12, 12, 12], fov: 45, near: 0.1, far: 500 }}
              onCreated={({ gl }) => setCanvasEl(gl.domElement as HTMLCanvasElement)}
              className="h-full w-full"
            >
              <PreviewScene walls={walls} shapes={shapes} cameras={cameras} people={people} selectedId={selectedId} focus={focus} showMap={showMap} />
            </Canvas>
          ) : (
            <div className="h-full w-full bg-card">
              <TopDownPreview
                walls={walls}
                shapes={shapes}
                cameras={cameras}
                people={people}
                selectedId={selectedId}
                onPersonSelect={(id) => setSelection({ kind: "person", id })}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex h-full flex-col gap-3">
        <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Mini map</p>
          <div className="mt-2 h-48 overflow-hidden rounded-xl border border-border/70 bg-muted/40">
            <TopDownPreview
              walls={walls}
              shapes={shapes}
              cameras={cameras}
              people={people}
              selectedId={selectedId}
              onPersonSelect={(id) => setSelection({ kind: "person", id })}
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">CCTV feeds</p>
            <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-2 overflow-y-auto">
            {cameraFeeds.map((feed) => (
              <div key={feed.id} className="relative aspect-video rounded-xl border border-border/60 bg-gradient-to-br from-slate-900 to-slate-800 p-2">
                <p className="text-xs text-muted-foreground">{feed.label}</p>
                <div className="absolute inset-2 rounded-lg border border-white/10 bg-black/30" />
                <div className="absolute inset-2">
                  {feed.detections
                    ?.filter((d) => d.visible && d.boundingBox)
                    .map((detection) => {
                      const box = detection.boundingBox!;
                      const cameraResolution = cameras.find((camera) => camera.id === feed.id)?.resolution ?? { width: 640, height: 360 };
                      return (
                        <div
                          key={detection.personId}
                          className="absolute border border-emerald-400/80 bg-emerald-500/10"
                          style={{
                            left: `${(box.x / cameraResolution.width) * 100}%`,
                            top: `${(box.y / cameraResolution.height) * 100}%`,
                            width: `${(box.width / cameraResolution.width) * 100}%`,
                            height: `${(box.height / cameraResolution.height) * 100}%`,
                          }}
                        />
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
