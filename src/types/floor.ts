export type WallType = 'exterior' | 'interior' | 'existing';
export type OpeningKind = 'door' | 'window';
export type FinishKind = 'paint' | 'wallpaper' | 'photo';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  a: [number, number];
  b: [number, number];
  thickness: number;
  type: WallType;
}

export interface Opening {
  id: string;
  wallId: string;
  /** Distance along wall from point a, in mm */
  offset: number;
  width: number;
  height: number;
  sill: number;
  kind: OpeningKind;
}

export interface Room {
  id: string;
  number: string;
  name: string;
  /** Axis-aligned or simple polygon in mm [x,y][] */
  polygon: [number, number][];
}

export interface FloorPlan {
  level: string;
  label: string;
  elevation: number;
  ceilingHeight: number;
  floorToFloor: number;
  walls: Wall[];
  openings: Opening[];
  rooms: Room[];
}

export interface FaceFinish {
  kind: FinishKind;
  color?: string;
  textureId?: string;
  imageId?: string;
  scale?: number;
  rotation?: number;
  offsetX?: number;
  offsetY?: number;
  fit?: 'stretch' | 'tile';
}

export interface DesignScheme {
  id: string;
  name: string;
  updatedAt: number;
  faces: Record<string, FaceFinish>;
  rooms: Record<string, { floor?: FaceFinish; ceiling?: FaceFinish }>;
  images: Record<string, string>;
}
