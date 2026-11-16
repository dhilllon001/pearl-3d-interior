import { get, set, del, keys } from 'idb-keyval';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { DesignScheme } from '../types/floor';

const SCHEME_PREFIX = 'pearl-scheme:';
const LAST_KEY = 'pearl-scheme:__last__';

export async function listSchemes(): Promise<{ id: string; name: string; updatedAt: number }[]> {
  const all = await keys();
  const ids = all
    .map(String)
    .filter((k) => k.startsWith(SCHEME_PREFIX) && !k.endsWith('__last__'));
  const items = [];
  for (const k of ids) {
    const s = (await get(k)) as DesignScheme | undefined;
    if (s) items.push({ id: s.id, name: s.name, updatedAt: s.updatedAt });
  }
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveScheme(scheme: DesignScheme): Promise<void> {
  await set(SCHEME_PREFIX + scheme.id, scheme);
  await set(LAST_KEY, scheme.id);
}

export async function loadScheme(id: string): Promise<DesignScheme | undefined> {
  return get(SCHEME_PREFIX + id);
}

export async function loadLastScheme(): Promise<DesignScheme | undefined> {
  const id = await get<string>(LAST_KEY);
  if (!id) return undefined;
  return loadScheme(id);
}

export async function deleteScheme(id: string): Promise<void> {
  await del(SCHEME_PREFIX + id);
}

export async function exportSchemeZip(scheme: DesignScheme): Promise<void> {
  const zip = new JSZip();
  const images = zip.folder('images')!;
  const meta = { ...scheme, images: {} as Record<string, string> };
  for (const [id, dataUrl] of Object.entries(scheme.images)) {
    const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
    if (match) {
      const ext = match[1].includes('png') ? 'png' : match[1].includes('webp') ? 'webp' : 'jpg';
      images.file(`${id}.${ext}`, match[2], { base64: true });
      meta.images[id] = `images/${id}.${ext}`;
    } else {
      meta.images[id] = dataUrl;
    }
  }
  zip.file('scheme.json', JSON.stringify(meta, null, 2));
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${scheme.name.replace(/\s+/g, '-') || 'scheme'}.zip`);
}

export async function importSchemeZip(file: File): Promise<DesignScheme> {
  const zip = await JSZip.loadAsync(file);
  const jsonFile = zip.file('scheme.json');
  if (!jsonFile) throw new Error('scheme.json missing');
  const meta = JSON.parse(await jsonFile.async('string')) as DesignScheme;
  const images: Record<string, string> = {};
  for (const [id, path] of Object.entries(meta.images ?? {})) {
    if (typeof path === 'string' && path.startsWith('images/')) {
      const f = zip.file(path);
      if (f) {
        const base64 = await f.async('base64');
        const ext = path.split('.').pop()?.toLowerCase();
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        images[id] = `data:${mime};base64,${base64}`;
      }
    } else if (typeof path === 'string' && path.startsWith('data:')) {
      images[id] = path;
    }
  }
  return {
    ...meta,
    id: crypto.randomUUID(),
    updatedAt: Date.now(),
    images,
  };
}

export function screenshotCanvas(filename = 'pearl-view.png'): void {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (blob) saveAs(blob, filename);
  });
}
