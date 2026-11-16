/**
 * Emit authored floor plans as JSON for the editor and runtime.
 * Run via: npx tsx scripts/export-floors.ts
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { floors } from '../src/data/floors/index';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/floors');

await mkdir(outDir, { recursive: true });
for (const f of floors) {
  const path = join(outDir, `${f.level}.json`);
  await writeFile(path, JSON.stringify(f, null, 2));
  console.log('Wrote', path, `(${f.walls.length} walls, ${f.rooms.length} rooms)`);
}
await writeFile(join(outDir, 'index.json'), JSON.stringify(floors.map((f) => ({ level: f.level, label: f.label })), null, 2));
console.log('Done.');
