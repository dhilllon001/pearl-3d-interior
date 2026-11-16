import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LEVELS, BUILDING_DEPTH, BUILDING_WIDTH, DEFAULT_WALL_THICKNESS } from '../../data/grid';
import { useAppStore } from '../../store/useAppStore';
import type { FloorPlan, Wall } from '../../types/floor';
import { room } from '../../data/buildFloor';

type Tool = 'select' | 'wall' | 'door' | 'room' | 'erase';

const PAD = 40;
const VIEW_W = 900;
const VIEW_H = 1100;

export function TracingEditor() {
  const floors = useAppStore((s) => s.floors);
  const replaceFloor = useAppStore((s) => s.replaceFloor);
  const [level, setLevel] = useState('3');
  const plan = floors.find((f) => f.level === level)!;
  const [local, setLocal] = useState<FloorPlan>(plan);
  const [tool, setTool] = useState<Tool>('wall');
  const [opacity, setOpacity] = useState(0.45);
  const [snap, setSnap] = useState(true);
  const [draft, setDraft] = useState<[number, number] | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [selectedWall, setSelectedWall] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState({ number: '', name: '' });
  const [roomCorner, setRoomCorner] = useState<[number, number] | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const p = floors.find((f) => f.level === level);
    if (p) {
      setLocal(structuredClone(p));
      setDraft(null);
      setSelectedWall(null);
      setRoomCorner(null);
    }
  }, [level, floors]);

  const levelMeta = LEVELS.find((l) => l.level === level)!;
  const sx = (VIEW_W - PAD * 2) / BUILDING_WIDTH;
  const sy = (VIEW_H - PAD * 2) / BUILDING_DEPTH;

  const toScreen = useCallback(
    (x: number, y: number) => [PAD + x * sx, PAD + (BUILDING_DEPTH - y) * sy] as [number, number],
    [sx, sy],
  );
  const toWorld = useCallback(
    (px: number, py: number): [number, number] => {
      let x = (px - PAD) / sx;
      let y = BUILDING_DEPTH - (py - PAD) / sy;
      if (snap) {
        x = Math.round(x / 100) * 100;
        y = Math.round(y / 100) * 100;
      }
      return [x, y];
    },
    [sx, sy, snap],
  );

  const getSvgPoint = (e: React.MouseEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return [0, 0] as [number, number];
    const p = pt.matrixTransform(ctm.inverse());
    return [p.x, p.y] as [number, number];
  };

  const onPointer = (e: React.MouseEvent) => {
    const [px, py] = getSvgPoint(e);
    setHover(toWorld(px, py));
  };

  const onClick = (e: React.MouseEvent) => {
    const [px, py] = getSvgPoint(e);
    const world = toWorld(px, py);

    if (tool === 'wall') {
      if (!draft) {
        setDraft(world);
      } else {
        if (draft[0] === world[0] && draft[1] === world[1]) return;
        const id = `w-${level}-edit-${Date.now()}`;
        const wall: Wall = {
          id,
          a: draft,
          b: world,
          thickness: DEFAULT_WALL_THICKNESS,
          type: 'interior',
        };
        setLocal((p) => ({ ...p, walls: [...p.walls, wall] }));
        setDraft(null);
      }
      return;
    }

    if (tool === 'erase') {
      // Erase nearest wall within 400mm
      let best: { id: string; d: number } | null = null;
      for (const w of local.walls) {
        const d = distPointSeg(world[0], world[1], w.a[0], w.a[1], w.b[0], w.b[1]);
        if (d < 400 && (!best || d < best.d)) best = { id: w.id, d };
      }
      if (best) {
        setLocal((p) => ({
          ...p,
          walls: p.walls.filter((w) => w.id !== best!.id),
          openings: p.openings.filter((o) => o.wallId !== best!.id),
        }));
      }
      return;
    }

    if (tool === 'door') {
      let best: { id: string; d: number; t: number; len: number } | null = null;
      for (const w of local.walls) {
        const { d, t, len } = projectPointSeg(world[0], world[1], w.a[0], w.a[1], w.b[0], w.b[1]);
        if (d < 400 && (!best || d < best.d)) best = { id: w.id, d, t, len };
      }
      if (best) {
        setLocal((p) => ({
          ...p,
          openings: [
            ...p.openings,
            {
              id: `o-${level}-${Date.now()}`,
              wallId: best!.id,
              offset: Math.max(0, best!.t * best!.len - 450),
              width: 900,
              height: 2100,
              sill: 0,
              kind: 'door',
            },
          ],
        }));
      }
      return;
    }

    if (tool === 'room') {
      if (!roomCorner) {
        setRoomCorner(world);
      } else {
        const x = Math.min(roomCorner[0], world[0]);
        const y = Math.min(roomCorner[1], world[1]);
        const w = Math.abs(world[0] - roomCorner[0]);
        const h = Math.abs(world[1] - roomCorner[1]);
        if (w > 200 && h > 200) {
          const r = room(
            roomForm.number || String(local.rooms.length + 1),
            roomForm.name || 'Room',
            x,
            y,
            w,
            h,
          );
          setLocal((p) => ({ ...p, rooms: [...p.rooms, r] }));
        }
        setRoomCorner(null);
      }
      return;
    }

    if (tool === 'select') {
      let best: { id: string; d: number } | null = null;
      for (const w of local.walls) {
        const d = distPointSeg(world[0], world[1], w.a[0], w.a[1], w.b[0], w.b[1]);
        if (d < 400 && (!best || d < best.d)) best = { id: w.id, d };
      }
      setSelectedWall(best?.id ?? null);
    }
  };

  const apply = () => {
    replaceFloor(local);
    // Also persist to downloadable JSON
    const blob = new Blob([JSON.stringify(local, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${level}.json`;
    a.click();
  };

  const gridLines = useMemo(() => {
    const lines: [number, number, number, number][] = [];
    // light 1m grid
    for (let x = 0; x <= BUILDING_WIDTH; x += 1000) lines.push([x, 0, x, BUILDING_DEPTH]);
    for (let y = 0; y <= BUILDING_DEPTH; y += 1000) lines.push([0, y, BUILDING_WIDTH, y]);
    return lines;
  }, []);

  return (
    <div className="editor">
      <header className="editor-bar">
        <Link to="/" className="chip">
          ← 3D View
        </Link>
        <strong>Plan Tracing Editor</strong>
        <div className="toolbar-group">
          {LEVELS.map((l) => (
            <button
              key={l.level}
              className={level === l.level ? 'chip active' : 'chip'}
              onClick={() => setLevel(l.level)}
            >
              {l.level}
            </button>
          ))}
        </div>
        <div className="toolbar-group">
          {(['select', 'wall', 'door', 'room', 'erase'] as Tool[]).map((t) => (
            <button key={t} className={tool === t ? 'chip active' : 'chip'} onClick={() => setTool(t)}>
              {t}
            </button>
          ))}
        </div>
        <label className="field inline">
          Underlay
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
        </label>
        <label className="inline">
          <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} /> Snap
          100mm
        </label>
        <button className="chip active" onClick={apply}>
          Apply to 3D + Download JSON
        </button>
      </header>

      <div className="editor-body">
        <div className="editor-canvas-wrap">
          <svg
            ref={svgRef}
            width={VIEW_W}
            height={VIEW_H}
            className="editor-svg"
            onMouseMove={onPointer}
            onClick={onClick}
          >
            <image
              href={levelMeta.planImage}
              x={0}
              y={0}
              width={VIEW_W}
              height={VIEW_H}
              opacity={opacity}
              preserveAspectRatio="xMidYMid meet"
            />
            {gridLines.map(([x1, y1, x2, y2], i) => {
              const [sx1, sy1] = toScreen(x1, y1);
              const [sx2, sy2] = toScreen(x2, y2);
              return (
                <line
                  key={i}
                  x1={sx1}
                  y1={sy1}
                  x2={sx2}
                  y2={sy2}
                  stroke="#94a3b822"
                  strokeWidth={1}
                />
              );
            })}
            {/* Building footprint */}
            {(() => {
              const [x1, y1] = toScreen(0, 0);
              const [x2, y2] = toScreen(BUILDING_WIDTH, BUILDING_DEPTH);
              return (
                <rect
                  x={Math.min(x1, x2)}
                  y={Math.min(y1, y2)}
                  width={Math.abs(x2 - x1)}
                  height={Math.abs(y2 - y1)}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
              );
            })()}
            {local.rooms.map((r) => {
              const xs = r.polygon.map((p) => p[0]);
              const ys = r.polygon.map((p) => p[1]);
              const [x1, y1] = toScreen(Math.min(...xs), Math.max(...ys));
              const [x2, y2] = toScreen(Math.max(...xs), Math.min(...ys));
              return (
                <g key={r.id}>
                  <rect
                    x={Math.min(x1, x2)}
                    y={Math.min(y1, y2)}
                    width={Math.abs(x2 - x1)}
                    height={Math.abs(y2 - y1)}
                    fill="#3B82F622"
                    stroke="#3B82F6"
                    strokeWidth={1}
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#1e293b"
                  >
                    {r.number}
                  </text>
                </g>
              );
            })}
            {local.walls.map((w) => {
              const [x1, y1] = toScreen(w.a[0], w.a[1]);
              const [x2, y2] = toScreen(w.b[0], w.b[1]);
              return (
                <line
                  key={w.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    selectedWall === w.id
                      ? '#3B82F6'
                      : w.type === 'exterior'
                        ? '#0f172a'
                        : '#ef4444'
                  }
                  strokeWidth={w.type === 'exterior' ? 4 : 2.5}
                />
              );
            })}
            {local.openings.map((o) => {
              const w = local.walls.find((wall) => wall.id === o.wallId);
              if (!w) return null;
              const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
              const t = (o.offset + o.width / 2) / len;
              const x = w.a[0] + (w.b[0] - w.a[0]) * t;
              const y = w.a[1] + (w.b[1] - w.a[1]) * t;
              const [sx, sy] = toScreen(x, y);
              return <circle key={o.id} cx={sx} cy={sy} r={5} fill="#22C55E" />;
            })}
            {draft && hover && tool === 'wall' && (
              <line
                x1={toScreen(...draft)[0]}
                y1={toScreen(...draft)[1]}
                x2={toScreen(...hover)[0]}
                y2={toScreen(...hover)[1]}
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            )}
            {roomCorner && hover && tool === 'room' && (
              <rect
                x={Math.min(toScreen(...roomCorner)[0], toScreen(...hover)[0])}
                y={Math.min(toScreen(...roomCorner)[1], toScreen(...hover)[1])}
                width={Math.abs(toScreen(...roomCorner)[0] - toScreen(...hover)[0])}
                height={Math.abs(toScreen(...roomCorner)[1] - toScreen(...hover)[1])}
                fill="#10B98133"
                stroke="#10B981"
              />
            )}
            {hover && (
              <circle
                cx={toScreen(...hover)[0]}
                cy={toScreen(...hover)[1]}
                r={4}
                fill="#3B82F6"
              />
            )}
          </svg>
        </div>

        <aside className="panel editor-side">
          <h2>{levelMeta.label}</h2>
          <p className="muted small">
            Trace walls over the PDF underlay. Snap is 100 mm. Apply pushes geometry into the live
            3D model and downloads JSON.
          </p>
          <p className="mono small">
            Walls: {local.walls.length} · Rooms: {local.rooms.length} · Openings:{' '}
            {local.openings.length}
          </p>
          {tool === 'room' && (
            <div className="section">
              <h3>New room</h3>
              <label className="field">
                Number
                <input
                  value={roomForm.number}
                  onChange={(e) => setRoomForm({ ...roomForm, number: e.target.value })}
                />
              </label>
              <label className="field">
                Name
                <input
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                />
              </label>
              <p className="muted small">Click two opposite corners on the plan.</p>
            </div>
          )}
          {selectedWall && (
            <div className="section">
              <h3>Selected wall</h3>
              <p className="mono small">{selectedWall}</p>
              <button
                className="btn"
                onClick={() => {
                  setLocal((p) => ({
                    ...p,
                    walls: p.walls.filter((w) => w.id !== selectedWall),
                    openings: p.openings.filter((o) => o.wallId !== selectedWall),
                  }));
                  setSelectedWall(null);
                }}
              >
                Delete wall
              </button>
            </div>
          )}
          <div className="section">
            <h3>Rooms</h3>
            <ul className="room-list">
              {local.rooms.map((r) => (
                <li key={r.id}>
                  <span>
                    {r.number} {r.name}
                  </span>
                  <button
                    className="icon-btn"
                    onClick={() =>
                      setLocal((p) => ({ ...p, rooms: p.rooms.filter((x) => x.id !== r.id) }))
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function distPointSeg(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-6) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function projectPointSeg(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  const len2 = len * len;
  let t = len2 < 1e-6 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  return { d, t, len };
}
