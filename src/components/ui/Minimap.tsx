import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BUILDING_DEPTH, BUILDING_WIDTH } from '../../data/grid';

const W = 220;
const H = 280;

export function Minimap() {
  const show = useAppStore((s) => s.showMinimap);
  const plan = useAppStore((s) => s.getFloor());
  const playerPos = useAppStore((s) => s.playerPos);
  const playerYaw = useAppStore((s) => s.playerYaw);
  const viewMode = useAppStore((s) => s.viewMode);

  const scaleX = W / BUILDING_WIDTH;
  const scaleY = H / BUILDING_DEPTH;

  const wallPaths = useMemo(
    () =>
      plan.walls
        .map((w) => {
          const x1 = w.a[0] * scaleX;
          const y1 = H - w.a[1] * scaleY;
          const x2 = w.b[0] * scaleX;
          const y2 = H - w.b[1] * scaleY;
          return `M${x1},${y1} L${x2},${y2}`;
        })
        .join(' '),
    [plan, scaleX, scaleY],
  );

  if (!show) return null;

  const px = playerPos[0] * 1000 * scaleX;
  const py = H - playerPos[2] * 1000 * scaleY;

  return (
    <div className="minimap">
      <div className="minimap-label">{plan.label}</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect width={W} height={H} fill="#f8fafc" rx={6} />
        <path d={wallPaths} stroke="#64748b" strokeWidth={1.2} fill="none" />
        {viewMode === 'walk' && (
          <g transform={`translate(${px},${py}) rotate(${(-playerYaw * 180) / Math.PI})`}>
            <circle r={4} fill="#3B82F6" />
            <polygon points="0,-10 4,2 -4,2" fill="#3B82F6" />
          </g>
        )}
      </svg>
    </div>
  );
}
