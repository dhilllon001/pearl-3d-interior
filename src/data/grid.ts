/** Structural grid from Ware Malcomb plans (mm). Origin at grid A / 1. */

export const GRID_X = [
  0, // A
  4000, // B
  7370, // C
  9800, // D
  11000, // E
  12580, // F
  14745, // G
  19690, // H
  25220, // I
  26420, // J
] as const;

/** Approximate bay spacing along depth (rows 1–12), totaling 36,925 mm */
export const GRID_Y = [
  0, // 1
  3357, // 2
  6714, // 3
  10071, // 4
  13428, // 5
  16785, // 6
  20142, // 7
  23499, // 8
  26856, // 9
  30213, // 10
  33570, // 11
  36925, // 12
] as const;

export const BUILDING_WIDTH = GRID_X[GRID_X.length - 1];
export const BUILDING_DEPTH = GRID_Y[GRID_Y.length - 1];

export const DEFAULT_CEILING = 2700;
export const DEFAULT_FLOOR_TO_FLOOR = 4200;
export const DEFAULT_WALL_THICKNESS = 150;
export const EXTERIOR_WALL_THICKNESS = 300;
export const DOOR_WIDTH = 900;
export const DOOR_HEIGHT = 2100;
export const WINDOW_SILL = 900;
export const WINDOW_HEIGHT = 1500;

export const LEVELS = [
  { level: 'B', label: 'Basement', elevation: 0, planImage: '/plans/p1.png' },
  { level: 'G', label: 'Ground Floor', elevation: 4200, planImage: '/plans/p2.png' },
  { level: '2', label: '2nd Floor', elevation: 8400, planImage: '/plans/p3.png' },
  { level: '3', label: '3rd Floor', elevation: 12600, planImage: '/plans/p4.png' },
  { level: '4', label: '4th Floor', elevation: 16800, planImage: '/plans/p5.png' },
  { level: '5', label: '5th Floor', elevation: 21000, planImage: '/plans/p6.png' },
] as const;

export function mmToM(mm: number): number {
  return mm / 1000;
}
