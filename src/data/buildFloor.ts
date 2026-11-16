import type { FloorPlan, Opening, Room, Wall, WallType } from '../types/floor';
import {
  BUILDING_DEPTH,
  BUILDING_WIDTH,
  DEFAULT_CEILING,
  DEFAULT_FLOOR_TO_FLOOR,
  DEFAULT_WALL_THICKNESS,
  DOOR_HEIGHT,
  DOOR_WIDTH,
  EXTERIOR_WALL_THICKNESS,
  WINDOW_HEIGHT,
  WINDOW_SILL,
} from './grid';

type Rect = { x: number; y: number; w: number; h: number };

function key(a: [number, number], b: [number, number]): string {
  const [x1, y1, x2, y2] =
    a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1])
      ? [a[0], a[1], b[0], b[1]]
      : [b[0], b[1], a[0], a[1]];
  return `${x1},${y1}|${x2},${y2}`;
}

function wallLen(a: [number, number], b: [number, number]): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** Midpoint door on a wall, offset from a */
function midDoor(wallId: string, a: [number, number], b: [number, number], id: string): Opening {
  const len = wallLen(a, b);
  return {
    id,
    wallId,
    offset: Math.max(200, (len - DOOR_WIDTH) / 2),
    width: DOOR_WIDTH,
    height: DOOR_HEIGHT,
    sill: 0,
    kind: 'door',
  };
}

export function rectPoly(r: Rect): [number, number][] {
  return [
    [r.x, r.y],
    [r.x + r.w, r.y],
    [r.x + r.w, r.y + r.h],
    [r.x, r.y + r.h],
  ];
}

export function room(
  number: string,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
): Room {
  return {
    id: `r-${number}`,
    number,
    name,
    polygon: rectPoly({ x, y, w, h }),
  };
}

interface EdgeMeta {
  a: [number, number];
  b: [number, number];
  type: WallType;
  thickness: number;
  door?: boolean;
  window?: boolean;
}

/**
 * Build a floor from room rects + optional extra walls.
 * Shared edges between rooms become single interior walls.
 * Building perimeter is always exterior.
 */
export function buildFloor(opts: {
  level: string;
  label: string;
  elevation: number;
  rooms: Room[];
  /** Extra wall segments not implied by rooms */
  extraWalls?: { a: [number, number]; b: [number, number]; type?: WallType; door?: boolean }[];
  /** Room numbers that should get a door on their longest interior edge */
  doorRooms?: string[];
  ceilingHeight?: number;
  floorToFloor?: number;
}): FloorPlan {
  const edges = new Map<string, EdgeMeta>();

  const addEdge = (
    a: [number, number],
    b: [number, number],
    type: WallType,
    thickness: number,
    flags?: { door?: boolean; window?: boolean },
  ) => {
    if (a[0] === b[0] && a[1] === b[1]) return;
    const k = key(a, b);
    const existing = edges.get(k);
    if (existing) {
      // Shared edge: keep as interior (or existing if either is)
      if (existing.type === 'exterior' && type === 'exterior') return;
      existing.type = existing.type === 'existing' || type === 'existing' ? 'existing' : 'interior';
      existing.thickness = DEFAULT_WALL_THICKNESS;
      if (flags?.door) existing.door = true;
      return;
    }
    edges.set(k, {
      a,
      b,
      type,
      thickness,
      door: flags?.door,
      window: flags?.window,
    });
  };

  // Exterior shell
  const W = BUILDING_WIDTH;
  const D = BUILDING_DEPTH;
  const corners: [number, number][] = [
    [0, 0],
    [W, 0],
    [W, D],
    [0, D],
  ];
  for (let i = 0; i < 4; i++) {
    addEdge(corners[i], corners[(i + 1) % 4], 'exterior', EXTERIOR_WALL_THICKNESS, {
      window: i !== 0, // skip south for entry treatment; windows on other sides
    });
  }

  // Room edges
  for (const r of opts.rooms) {
    const poly = r.polygon;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      addEdge(a, b, 'interior', DEFAULT_WALL_THICKNESS);
    }
  }

  for (const ew of opts.extraWalls ?? []) {
    addEdge(ew.a, ew.b, ew.type ?? 'interior', DEFAULT_WALL_THICKNESS, { door: ew.door });
  }

  // Mark doors for requested rooms: longest non-exterior edge
  const doorSet = new Set(opts.doorRooms ?? opts.rooms.map((r) => r.number));
  for (const r of opts.rooms) {
    if (!doorSet.has(r.number)) continue;
    let best: { k: string; len: number } | null = null;
    const poly = r.polygon;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const k = key(a, b);
      const meta = edges.get(k);
      if (!meta || meta.type === 'exterior') continue;
      const len = wallLen(a, b);
      if (!best || len > best.len) best = { k, len };
    }
    if (best) {
      const meta = edges.get(best.k)!;
      meta.door = true;
    }
  }

  const walls: Wall[] = [];
  const openings: Opening[] = [];
  let wi = 0;
  let oi = 0;

  for (const meta of edges.values()) {
    const id = `w-${opts.level}-${wi++}`;
    walls.push({
      id,
      a: meta.a,
      b: meta.b,
      thickness: meta.thickness,
      type: meta.type,
    });

    if (meta.door && meta.type !== 'exterior') {
      openings.push(midDoor(id, meta.a, meta.b, `o-${opts.level}-${oi++}`));
    }

    if (meta.window && meta.type === 'exterior') {
      const len = wallLen(meta.a, meta.b);
      // Place a series of windows along exterior
      const spacing = 3000;
      const winW = 1800;
      for (let off = 800; off + winW < len; off += spacing) {
        openings.push({
          id: `o-${opts.level}-${oi++}`,
          wallId: id,
          offset: off,
          width: winW,
          height: WINDOW_HEIGHT,
          sill: WINDOW_SILL,
          kind: 'window',
        });
      }
    }
  }

  return {
    level: opts.level,
    label: opts.label,
    elevation: opts.elevation,
    ceilingHeight: opts.ceilingHeight ?? DEFAULT_CEILING,
    floorToFloor: opts.floorToFloor ?? DEFAULT_FLOOR_TO_FLOOR,
    walls,
    openings,
    rooms: opts.rooms,
  };
}
