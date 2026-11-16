import * as THREE from 'three';
import type { FaceFinish, FloorPlan, Opening, Wall } from '../types/floor';
import { mmToM } from '../data/grid';

export type FaceId = string; // `${wallId}:A` | `${wallId}:B`

export interface WallMeshData {
  wallId: string;
  faceA: FaceId;
  faceB: FaceId;
  /** World-space box for this wall segment (after openings split) */
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth (thickness)
  rotationY: number;
  kind: 'solid' | 'header' | 'sill' | 'jamb';
}

export interface SlabData {
  roomId: string;
  position: [number, number, number];
  size: [number, number];
  y: number;
}

export interface FloorGeometry {
  level: string;
  elevationM: number;
  ceilingHeightM: number;
  walls: WallMeshData[];
  floors: SlabData[];
  ceilings: SlabData[];
  /** Horizontal segments for collision (x,z in meters, y ignored) */
  colliders: { a: [number, number]; b: [number, number]; thickness: number }[];
}

function wallFrame(wall: Wall) {
  const ax = mmToM(wall.a[0]);
  const az = mmToM(wall.a[1]);
  const bx = mmToM(wall.b[0]);
  const bz = mmToM(wall.b[1]);
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  return { ax, az, bx, bz, dx, dz, len, angle, thickness: mmToM(wall.thickness) };
}

function openingsOnWall(wall: Wall, openings: Opening[]): Opening[] {
  return openings
    .filter((o) => o.wallId === wall.id)
    .sort((a, b) => a.offset - b.offset);
}

/**
 * Split a wall into solid boxes with door/window cutouts.
 * Each solid piece exposes faces A (inside of direction of wall normal) and B.
 */
export function buildWallMeshes(
  wall: Wall,
  openings: Opening[],
  elevationM: number,
  ceilingHeightM: number,
): WallMeshData[] {
  const f = wallFrame(wall);
  if (f.len < 0.05) return [];

  const pieces: WallMeshData[] = [];
  const ops = openingsOnWall(wall, openings);
  const h = ceilingHeightM;

  // Convert openings to meters along wall
  type Gap = { start: number; end: number; sill: number; top: number; kind: string };
  const gaps: Gap[] = ops.map((o) => {
    const start = mmToM(o.offset);
    const end = start + mmToM(o.width);
    return {
      start: Math.max(0, start),
      end: Math.min(f.len, end),
      sill: mmToM(o.sill),
      top: mmToM(o.sill + o.height),
      kind: o.kind,
    };
  });

  const pushBox = (
    along0: number,
    along1: number,
    y0: number,
    y1: number,
    kind: WallMeshData['kind'],
  ) => {
    const w = along1 - along0;
    const hh = y1 - y0;
    if (w < 0.02 || hh < 0.02) return;
    const mid = along0 + w / 2;
    const cx = f.ax + Math.cos(f.angle) * mid;
    const cz = f.az + Math.sin(f.angle) * mid;
    pieces.push({
      wallId: wall.id,
      faceA: `${wall.id}:A`,
      faceB: `${wall.id}:B`,
      position: [cx, elevationM + y0 + hh / 2, cz],
      size: [w, hh, f.thickness],
      rotationY: -f.angle,
      kind,
    });
  };

  // Merge overlapping gaps
  gaps.sort((a, b) => a.start - b.start);

  let cursor = 0;
  for (const g of gaps) {
    if (g.start > cursor) {
      pushBox(cursor, g.start, 0, h, 'solid');
    }
    // Below opening (sill) — windows only
    if (g.sill > 0.02) {
      pushBox(g.start, g.end, 0, g.sill, 'sill');
    }
    // Above opening (header)
    if (g.top < h - 0.02) {
      pushBox(g.start, g.end, Math.min(g.top, h), h, 'header');
    }
    cursor = Math.max(cursor, g.end);
  }
  if (cursor < f.len) {
    pushBox(cursor, f.len, 0, h, 'solid');
  }

  return pieces;
}

export function buildSlabs(plan: FloorPlan): { floors: SlabData[]; ceilings: SlabData[] } {
  const elev = mmToM(plan.elevation);
  const ch = mmToM(plan.ceilingHeight);
  const floors: SlabData[] = [];
  const ceilings: SlabData[] = [];

  for (const room of plan.rooms) {
    const xs = room.polygon.map((p) => p[0]);
    const ys = room.polygon.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = mmToM(maxX - minX);
    const d = mmToM(maxY - minY);
    const cx = mmToM((minX + maxX) / 2);
    const cz = mmToM((minY + maxY) / 2);
    floors.push({
      roomId: room.id,
      position: [cx, elev + 0.01, cz],
      size: [w, d],
      y: elev,
    });
    ceilings.push({
      roomId: room.id,
      position: [cx, elev + ch - 0.01, cz],
      size: [w, d],
      y: elev + ch,
    });
  }
  return { floors, ceilings };
}

export function buildFloorGeometry(plan: FloorPlan): FloorGeometry {
  const elevationM = mmToM(plan.elevation);
  const ceilingHeightM = mmToM(plan.ceilingHeight);
  const walls: WallMeshData[] = [];
  for (const wall of plan.walls) {
    walls.push(...buildWallMeshes(wall, plan.openings, elevationM, ceilingHeightM));
  }
  const { floors, ceilings } = buildSlabs(plan);
  const colliders = plan.walls.map((w) => ({
    a: [mmToM(w.a[0]), mmToM(w.a[1])] as [number, number],
    b: [mmToM(w.b[0]), mmToM(w.b[1])] as [number, number],
    thickness: mmToM(w.thickness),
  }));

  return {
    level: plan.level,
    elevationM,
    ceilingHeightM,
    walls,
    floors,
    ceilings,
    colliders,
  };
}

export function defaultFinishForWall(type: Wall['type']): FaceFinish {
  if (type === 'exterior') return { kind: 'paint', color: '#E8E4DC' };
  if (type === 'existing') return { kind: 'paint', color: '#D4D0C8' };
  return { kind: 'paint', color: '#F5F5F0' };
}

/** Simple 2D point-segment distance for collision */
export function distToSegment(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  if (len2 < 1e-8) return Math.hypot(px - ax, pz - az);
  let t = ((px - ax) * dx + (pz - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx;
  const qz = az + t * dz;
  return Math.hypot(px - qx, pz - qz);
}

export function resolveCollision(
  x: number,
  z: number,
  radius: number,
  colliders: FloorGeometry['colliders'],
): [number, number] {
  let nx = x;
  let nz = z;
  for (let iter = 0; iter < 3; iter++) {
    for (const c of colliders) {
      const d = distToSegment(nx, nz, c.a[0], c.a[1], c.b[0], c.b[1]);
      const minD = radius + c.thickness / 2;
      if (d < minD && d > 1e-6) {
        // Push out along vector from closest point
        const ax = c.a[0],
          az = c.a[1],
          bx = c.b[0],
          bz = c.b[1];
        const dx = bx - ax;
        const dz = bz - az;
        const len2 = dx * dx + dz * dz;
        let t = ((nx - ax) * dx + (nz - az) * dz) / len2;
        t = Math.max(0, Math.min(1, t));
        const qx = ax + t * dx;
        const qz = az + t * dz;
        const ex = (nx - qx) / d;
        const ez = (nz - qz) / d;
        nx = qx + ex * minD;
        nz = qz + ez * minD;
      }
    }
  }
  return [nx, nz];
}

// silence unused THREE import warning if tree-shaken — keep for texture helpers
export const _three = THREE;
