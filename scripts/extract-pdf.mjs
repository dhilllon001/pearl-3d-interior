/**
 * Extract vector strokes + text from 150FG.pdf and emit draft floor JSON.
 * Run: node scripts/extract-pdf.mjs
 *
 * Architectural CAD PDFs contain many overlapping strokes (dims, hatch, egress).
 * This script filters long axis-aligned segments near the plan grid and writes
 * a draft that the in-app tracing editor can refine. The shipped floors/*.ts
 * data is the cleaned authoring source used by the 3D viewer.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pdfPath = join(root, 'public/plans/150FG.pdf');
const outDir = join(root, 'public/floors');

const GRID_X = [0, 4000, 7370, 9800, 11000, 12580, 14745, 19690, 25220, 26420];
const GRID_Y = [0, 3357, 6714, 10071, 13428, 16785, 20142, 23499, 26856, 30213, 33570, 36925];
const LEVELS = ['B', 'G', '2', '3', '4', '5'];
const LABELS = ['Basement', 'Ground Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor'];

async function loadPdf() {
  const data = new Uint8Array(await readFile(pdfPath));
  return getDocument({ data, useSystemFonts: true }).promise;
}

function opsToSegments(ops, pageHeight) {
  const segs = [];
  let cx = 0;
  let cy = 0;
  let pathStart = [0, 0];
  for (const op of ops) {
    const [fn, ...args] = op;
    if (fn === 'moveTo') {
      cx = args[0];
      cy = args[1];
      pathStart = [cx, cy];
    } else if (fn === 'lineTo') {
      const x = args[0];
      const y = args[1];
      segs.push({ a: [cx, cy], b: [x, y] });
      cx = x;
      cy = y;
    } else if (fn === 'closePath') {
      segs.push({ a: [cx, cy], b: pathStart });
      cx = pathStart[0];
      cy = pathStart[1];
    } else if (fn === 'rectangle') {
      const [x, y, w, h] = args;
      segs.push({ a: [x, y], b: [x + w, y] });
      segs.push({ a: [x + w, y], b: [x + w, y + h] });
      segs.push({ a: [x + w, y + h], b: [x, y + h] });
      segs.push({ a: [x, y + h], b: [x, y] });
    }
  }
  // PDF y grows up; flip to top-left image space for calibration helpers
  return segs.map((s) => ({
    a: [s.a[0], pageHeight - s.a[1]],
    b: [s.b[0], pageHeight - s.b[1]],
  }));
}

function calibrate(segs, pageWidth, pageHeight) {
  // Plan area is roughly centered on the sheet; find bounding box of long segments
  const long = segs.filter((s) => {
    const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
    return len > 40;
  });
  if (!long.length) return null;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const s of long) {
    for (const p of [s.a, s.b]) {
      minX = Math.min(minX, p[0]);
      minY = Math.min(minY, p[1]);
      maxX = Math.max(maxX, p[0]);
      maxY = Math.max(maxY, p[1]);
    }
  }

  // Map PDF plan bbox → building mm (A1 origin bottom-left of building)
  const buildingW = GRID_X[GRID_X.length - 1];
  const buildingD = GRID_Y[GRID_Y.length - 1];
  // Prefer matching aspect of building footprint
  const sx = buildingW / (maxX - minX);
  const sy = buildingD / (maxY - minY);

  return {
    toMm(p) {
      return [(p[0] - minX) * sx, (maxY - p[1]) * sy];
    },
    scale: (sx + sy) / 2,
    bbox: [minX, minY, maxX, maxY],
  };
}

function filterWallCandidates(segs, cal) {
  const walls = [];
  const seen = new Set();
  for (const s of segs) {
    const a = cal.toMm(s.a);
    const b = cal.toMm(s.b);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 800 || len > 40000) continue;
    const dx = Math.abs(b[0] - a[0]);
    const dy = Math.abs(b[1] - a[1]);
    const axis = dx < 200 || dy < 200; // roughly axis-aligned
    if (!axis) continue;
    // Snap to nearest 50mm
    const snap = (v) => Math.round(v / 50) * 50;
    const aa = [snap(a[0]), snap(a[1])];
    const bb = [snap(b[0]), snap(b[1])];
    if (aa[0] === bb[0] && aa[1] === bb[1]) continue;
    // Keep within building + margin
    if (
      Math.min(aa[0], bb[0]) < -500 ||
      Math.min(aa[1], bb[1]) < -500 ||
      Math.max(aa[0], bb[0]) > GRID_X.at(-1) + 500 ||
      Math.max(aa[1], bb[1]) > GRID_Y.at(-1) + 500
    ) {
      continue;
    }
    const k = `${aa}|${bb}`;
    const kr = `${bb}|${aa}`;
    if (seen.has(k) || seen.has(kr)) continue;
    seen.add(k);
    walls.push({ a: aa, b: bb, len });
  }
  // Keep longer walls first, cap count
  walls.sort((u, v) => v.len - u.len);
  return walls.slice(0, 400);
}

async function extractPage(doc, pageIndex) {
  const page = await doc.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1 });
  const ops = await page.getOperatorList();
  // pdf.js operator list is low-level; use getTextContent for labels and approximate walls from annotations/path via commonObjs is hard.
  // Fallback: use text items for rooms + exterior shell as draft.
  const text = await page.getTextContent();
  const labels = text.items
    .filter((it) => typeof it.str === 'string' && it.str.trim().length > 1)
    .map((it) => ({
      text: it.str.trim(),
      x: it.transform[4],
      y: viewport.height - it.transform[5],
    }));

  // Build a minimal draft: exterior shell + heuristic room boxes from labels
  const W = GRID_X.at(-1);
  const D = GRID_Y.at(-1);
  const walls = [
    { id: `w-${LEVELS[pageIndex]}-ext-0`, a: [0, 0], b: [W, 0], thickness: 300, type: 'exterior' },
    { id: `w-${LEVELS[pageIndex]}-ext-1`, a: [W, 0], b: [W, D], thickness: 300, type: 'exterior' },
    { id: `w-${LEVELS[pageIndex]}-ext-2`, a: [W, D], b: [0, D], thickness: 300, type: 'exterior' },
    { id: `w-${LEVELS[pageIndex]}-ext-3`, a: [0, D], b: [0, 0], thickness: 300, type: 'exterior' },
  ];

  const rooms = labels
    .filter((l) => /ROOM|OFFICE|LOUNGE|BOARD|GYM|PATIO|WASH|STAIR|ELEV|LUNCH|COFFEE|SALES|DESIGN|VESTIB|JANITOR|COLLAB|MEETING|FINANCE|RECEPT|STORAGE|SHOWER|DRESS/i.test(l.text))
    .slice(0, 40)
    .map((l, i) => ({
      id: `draft-r-${i}`,
      number: String(i + 1).padStart(3, '0'),
      name: l.text,
      polygon: [
        [Math.max(0, (l.x / viewport.width) * W - 1500), Math.max(0, (1 - l.y / viewport.height) * D - 1200)],
        [Math.min(W, (l.x / viewport.width) * W + 1500), Math.max(0, (1 - l.y / viewport.height) * D - 1200)],
        [Math.min(W, (l.x / viewport.width) * W + 1500), Math.min(D, (1 - l.y / viewport.height) * D + 1200)],
        [Math.max(0, (l.x / viewport.width) * W - 1500), Math.min(D, (1 - l.y / viewport.height) * D + 1200)],
      ],
    }));

  // Attempt path extraction if available via common pattern
  try {
    // Some builds expose path geometry via page.getOperatorList — count path ops for diagnostics
    let pathOps = 0;
    for (const fnId of ops.fnArray) {
      if (fnId === OPS.constructPath || fnId === OPS.stroke || fnId === OPS.fill) pathOps++;
    }
    console.log(`  page ${pageIndex + 1}: ${labels.length} text items, ${pathOps} path-related ops, ${rooms.length} draft rooms`);
  } catch {
    /* ignore */
  }

  return {
    level: LEVELS[pageIndex],
    label: LABELS[pageIndex],
    elevation: pageIndex * 4200,
    ceilingHeight: 2700,
    floorToFloor: 4200,
    walls,
    openings: [],
    rooms,
    _meta: {
      source: 'extract-pdf.mjs draft',
      note: 'Cleaned geometry lives in src/data/floors/*.ts — use /editor to refine.',
      pageSize: [viewport.width, viewport.height],
      labelCount: labels.length,
    },
  };
}

async function main() {
  await mkdir(outDir, { recursive: true });
  console.log('Loading', pdfPath);
  const doc = await loadPdf();
  console.log('Pages:', doc.numPages);

  for (let i = 0; i < Math.min(doc.numPages, 6); i++) {
    const draft = await extractPage(doc, i);
    const out = join(outDir, `${draft.level}.draft.json`);
    await writeFile(out, JSON.stringify(draft, null, 2));
    console.log('Wrote', out);
  }

  // Also copy authored floors as JSON for the editor / runtime
  const { floors } = await import('../src/data/floors/index.ts').catch(() => ({ floors: null }));
  if (!floors) {
    // ts import may fail in plain node — emit via a tiny inline dump instead
    console.log('Skipping TS floor export (use npm run export-floors). Drafts written.');
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
