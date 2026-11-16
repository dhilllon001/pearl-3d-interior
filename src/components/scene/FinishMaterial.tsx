import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { FaceFinish } from '../../types/floor';
import { WALLPAPERS, paintWallpaper } from '../../data/textures';
import { useAppStore } from '../../store/useAppStore';

const textureCache = new Map<string, THREE.CanvasTexture>();

function wallpaperTexture(id: string): THREE.CanvasTexture {
  const cached = textureCache.get(id);
  if (cached) return cached;
  const preset = WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  paintWallpaper(ctx, 256, preset);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(id, tex);
  return tex;
}

function imageTexture(dataUrl: string, finish: FaceFinish): THREE.Texture {
  const key = `img:${dataUrl.slice(0, 64)}:${finish.scale}:${finish.fit}`;
  const cached = textureCache.get(key);
  if (cached) return cached;
  const loader = new THREE.TextureLoader();
  const tex = loader.load(dataUrl);
  tex.colorSpace = THREE.SRGBColorSpace;
  const scale = finish.scale ?? 1;
  if (finish.fit === 'tile') {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(scale, scale);
  } else {
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1, 1);
  }
  if (finish.offsetX || finish.offsetY) {
    tex.offset.set(finish.offsetX ?? 0, finish.offsetY ?? 0);
  }
  if (finish.rotation) {
    tex.rotation = (finish.rotation * Math.PI) / 180;
    tex.center.set(0.5, 0.5);
  }
  textureCache.set(key, tex as unknown as THREE.CanvasTexture);
  return tex;
}

export function useFinishMaterial(
  finish: FaceFinish | undefined,
  fallbackColor = '#F5F5F0',
  side: THREE.Side = THREE.FrontSide,
) {
  const images = useAppStore((s) => s.scheme.images);
  const [map, setMap] = useState<THREE.Texture | null>(null);

  const color = finish?.kind === 'paint' ? finish.color ?? fallbackColor : '#ffffff';

  useEffect(() => {
    if (!finish || finish.kind === 'paint') {
      setMap(null);
      return;
    }
    if (finish.kind === 'wallpaper' && finish.textureId) {
      const tex = wallpaperTexture(finish.textureId);
      const scale = finish.scale ?? 2;
      tex.repeat.set(scale, scale);
      setMap(tex);
      return;
    }
    if (finish.kind === 'photo' && finish.imageId && images[finish.imageId]) {
      setMap(imageTexture(images[finish.imageId], finish));
    }
  }, [finish, images]);

  return useMemo(
    () => ({
      color,
      map,
      side,
      roughness: 0.85,
      metalness: 0.02,
    }),
    [color, map, side],
  );
}

interface Props {
  finish?: FaceFinish;
  fallbackColor?: string;
  side?: THREE.Side;
}

/** Convenience mesh-standard material from a finish */
export function FinishMaterial({ finish, fallbackColor = '#F5F5F0', side = THREE.FrontSide }: Props) {
  const props = useFinishMaterial(finish, fallbackColor, side);
  return <meshStandardMaterial {...props} />;
}
