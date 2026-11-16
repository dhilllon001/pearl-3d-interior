export interface WallpaperPreset {
  id: string;
  name: string;
  /** CSS / canvas pattern generator key */
  pattern: 'linen' | 'herringbone' | 'damask' | 'grasscloth' | 'geometric' | 'wood' | 'concrete' | 'tile';
  baseColor: string;
  accentColor: string;
}

export const WALLPAPERS: WallpaperPreset[] = [
  { id: 'linen-cream', name: 'Linen Cream', pattern: 'linen', baseColor: '#F3EDE3', accentColor: '#E4D9C8' },
  { id: 'linen-grey', name: 'Linen Grey', pattern: 'linen', baseColor: '#E8E8E4', accentColor: '#D0D0CC' },
  { id: 'herringbone', name: 'Herringbone', pattern: 'herringbone', baseColor: '#D9CFC0', accentColor: '#C4B5A0' },
  { id: 'damask-navy', name: 'Damask Navy', pattern: 'damask', baseColor: '#1E2A44', accentColor: '#2E3F66' },
  { id: 'grasscloth', name: 'Grasscloth', pattern: 'grasscloth', baseColor: '#C9C2A8', accentColor: '#B0A88E' },
  { id: 'geo-teal', name: 'Geometric Teal', pattern: 'geometric', baseColor: '#E6F2F0', accentColor: '#5B9A92' },
  { id: 'wood-oak', name: 'Oak Panels', pattern: 'wood', baseColor: '#C4A574', accentColor: '#A88755' },
  { id: 'concrete', name: 'Concrete', pattern: 'concrete', baseColor: '#B8B8B4', accentColor: '#9A9A96' },
  { id: 'tile-white', name: 'Subway Tile', pattern: 'tile', baseColor: '#F7F7F5', accentColor: '#D8D8D4' },
];

export const PAINT_PALETTE = [
  '#FFFFFF',
  '#F5F5F0',
  '#E8E4DC',
  '#D4CFC5',
  '#C9B8A8',
  '#8B7355',
  '#5C4A3A',
  '#2C2C2C',
  '#1E2A44',
  '#3B5998',
  '#5B9A92',
  '#8FAE6E',
  '#E8D5A3',
  '#C97B63',
  '#A63D40',
];

/** Generate a wallpaper canvas texture (client-side) */
export function paintWallpaper(
  ctx: CanvasRenderingContext2D,
  size: number,
  preset: WallpaperPreset,
): void {
  const { pattern, baseColor, accentColor } = preset;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = accentColor;
  ctx.fillStyle = accentColor;

  if (pattern === 'linen') {
    for (let i = 0; i < size; i += 3) {
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (pattern === 'herringbone') {
    const s = 16;
    ctx.lineWidth = 2;
    for (let y = 0; y < size; y += s) {
      for (let x = 0; x < size; x += s * 2) {
        const ox = (y / s) % 2 === 0 ? 0 : s;
        ctx.beginPath();
        ctx.moveTo(x + ox, y);
        ctx.lineTo(x + ox + s, y + s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + ox + s, y);
        ctx.lineTo(x + ox, y + s);
        ctx.stroke();
      }
    }
  } else if (pattern === 'damask') {
    for (let y = 20; y < size; y += 40) {
      for (let x = 20; x < size; x += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 20, y + 20, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  } else if (pattern === 'grasscloth') {
    ctx.lineWidth = 1;
    for (let y = 0; y < size; y += 2) {
      ctx.globalAlpha = 0.2 + (y % 7) * 0.02;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + ((y % 5) - 2));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (pattern === 'geometric') {
    const s = 32;
    ctx.lineWidth = 2;
    for (let y = 0; y < size; y += s) {
      for (let x = 0; x < size; x += s) {
        ctx.strokeRect(x + 4, y + 4, s - 8, s - 8);
        ctx.beginPath();
        ctx.moveTo(x + 4, y + s / 2);
        ctx.lineTo(x + s - 4, y + s / 2);
        ctx.stroke();
      }
    }
  } else if (pattern === 'wood') {
    const plank = 28;
    for (let y = 0; y < size; y += plank) {
      ctx.fillStyle = y % (plank * 2) === 0 ? baseColor : accentColor;
      ctx.fillRect(0, y, size, plank - 1);
      ctx.strokeStyle = '#00000022';
      ctx.strokeRect(0, y, size, plank);
    }
  } else if (pattern === 'concrete') {
    for (let i = 0; i < 800; i++) {
      ctx.globalAlpha = Math.random() * 0.15;
      ctx.fillStyle = Math.random() > 0.5 ? accentColor : '#ffffff';
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }
    ctx.globalAlpha = 1;
  } else if (pattern === 'tile') {
    const tw = 40;
    const th = 20;
    ctx.lineWidth = 2;
    ctx.strokeStyle = accentColor;
    for (let y = 0; y < size; y += th) {
      const ox = (y / th) % 2 === 0 ? 0 : tw / 2;
      for (let x = -tw; x < size; x += tw) {
        ctx.strokeRect(x + ox, y, tw, th);
      }
    }
  }
}
