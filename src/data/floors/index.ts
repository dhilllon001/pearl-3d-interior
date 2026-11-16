import type { FloorPlan } from '../../types/floor';
import { basement } from './basement';
import { ground } from './ground';
import { floor2 } from './floor2';
import { floor3 } from './floor3';
import { floor4 } from './floor4';
import { floor5 } from './floor5';

export const floors: FloorPlan[] = [basement, ground, floor2, floor3, floor4, floor5];

export function getFloor(level: string): FloorPlan | undefined {
  return floors.find((f) => f.level === level);
}

export { basement, ground, floor2, floor3, floor4, floor5 };
