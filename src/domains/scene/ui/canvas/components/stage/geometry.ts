import type { Vector2 } from "@/domains/scene/core/types";

export function trianglePoints(center: Vector2, radius: number, rotation = 0): Vector2[] {
  const points: Vector2[] = [];
  for (let i = 0; i < 3; i++) {
    const angle = (((i * 120 - 90) + rotation) * Math.PI) / 180;
    points.push({ x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) });
  }
  return points;
}

export function pointInTriangle(p: Vector2, [a, b, c]: Vector2[]) {
  const area = (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2;
  const area1 = (p.x * (a.y - b.y) + a.x * (b.y - p.y) + b.x * (p.y - a.y)) / 2;
  const area2 = (p.x * (b.y - c.y) + b.x * (c.y - p.y) + c.x * (p.y - b.y)) / 2;
  const area3 = (p.x * (c.y - a.y) + c.x * (a.y - p.y) + a.x * (p.y - c.y)) / 2;
  return Math.abs(area) >= Math.abs(area1 + area2 + area3) - 0.1;
}

export function pointSegmentDistance(point: Vector2, start: Vector2, end: Vector2) {
  const ap = { x: point.x - start.x, y: point.y - start.y };
  const ab = { x: end.x - start.x, y: end.y - start.y };
  const t = Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y) / (ab.x * ab.x + ab.y * ab.y)));
  const closest = { x: start.x + ab.x * t, y: start.y + ab.y * t };
  return Math.hypot(point.x - closest.x, point.y - closest.y);
}
