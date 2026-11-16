import { Link } from 'react-router-dom';
import { LEVELS } from '../../data/grid';
import { useAppStore } from '../../store/useAppStore';
import {
  exportSchemeZip,
  importSchemeZip,
  listSchemes,
  loadScheme,
  saveScheme,
  screenshotCanvas,
} from '../../utils/schemeIO';
import { useEffect, useState } from 'react';

export function Toolbar() {
  const currentLevel = useAppStore((s) => s.currentLevel);
  const setLevel = useAppStore((s) => s.setLevel);
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const scheme = useAppStore((s) => s.scheme);
  const renameScheme = useAppStore((s) => s.renameScheme);
  const loadSchemeIntoStore = useAppStore((s) => s.loadScheme);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const floors = useAppStore((s) => s.floors);
  const setPlayer = useAppStore((s) => s.setPlayer);
  const showCeilings = useAppStore((s) => s.showCeilings);
  const setShowCeilings = useAppStore((s) => s.setShowCeilings);

  const [roomQuery, setRoomQuery] = useState('');
  const [saved, setSaved] = useState<{ id: string; name: string }[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    listSchemes().then(setSaved);
  }, [scheme.updatedAt]);

  const flash = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(''), 2200);
  };

  const plan = floors.find((f) => f.level === currentLevel);

  const goToRoom = (roomId: string) => {
    if (!plan) return;
    const room = plan.rooms.find((r) => r.id === roomId);
    if (!room) return;
    const xs = room.polygon.map((p) => p[0]);
    const ys = room.polygon.map((p) => p[1]);
    const x = (Math.min(...xs) + Math.max(...xs)) / 2000;
    const z = (Math.min(...ys) + Math.max(...ys)) / 2000;
    const y = plan.elevation / 1000 + 1.6;
    setViewMode('walk');
    setPlayer([x, y, z]);
    useAppStore.getState().selectRoom(roomId);
    setRoomQuery('');
  };

  const matches =
    roomQuery.trim().length > 0 && plan
      ? plan.rooms.filter(
          (r) =>
            r.name.toLowerCase().includes(roomQuery.toLowerCase()) ||
            r.number.includes(roomQuery),
        )
      : [];

  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <strong>Pearl 3D</strong>
        <span className="muted">152 First Gulf Blvd</span>
      </div>

      <div className="toolbar-group">
        {LEVELS.map((l) => (
          <button
            key={l.level}
            className={currentLevel === l.level ? 'chip active' : 'chip'}
            onClick={() => setLevel(l.level)}
            title={l.label}
          >
            {l.level}
          </button>
        ))}
      </div>

      <div className="toolbar-group">
        <button
          className={viewMode === 'dollhouse' ? 'chip active' : 'chip'}
          onClick={() => setViewMode('dollhouse')}
        >
          Dollhouse
        </button>
        <button
          className={viewMode === 'walk' ? 'chip active' : 'chip'}
          onClick={() => setViewMode('walk')}
        >
          Walk
        </button>
        <button className="chip" onClick={() => setShowCeilings(!showCeilings)}>
          {showCeilings ? 'Hide ceilings' : 'Show ceilings'}
        </button>
      </div>

      <div className="toolbar-group room-search">
        <input
          placeholder="Go to room…"
          value={roomQuery}
          onChange={(e) => setRoomQuery(e.target.value)}
        />
        {matches.length > 0 && (
          <ul className="room-results">
            {matches.slice(0, 8).map((r) => (
              <li key={r.id}>
                <button onClick={() => goToRoom(r.id)}>
                  {r.number} — {r.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="toolbar-group">
        <input
          className="scheme-name"
          value={scheme.name}
          onChange={(e) => renameScheme(e.target.value)}
        />
        <button
          className="chip"
          onClick={async () => {
            await saveScheme(scheme);
            flash('Saved');
            setSaved(await listSchemes());
          }}
        >
          Save
        </button>
        <select
          className="chip select"
          value=""
          onChange={async (e) => {
            const id = e.target.value;
            if (!id) return;
            const s = await loadScheme(id);
            if (s) {
              loadSchemeIntoStore(s);
              flash('Loaded');
            }
          }}
        >
          <option value="">Load…</option>
          {saved.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button className="chip" onClick={() => exportSchemeZip(scheme)}>
          Export
        </button>
        <label className="chip file-chip">
          Import
          <input
            type="file"
            accept=".zip"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const s = await importSchemeZip(file);
                loadSchemeIntoStore(s);
                await saveScheme(s);
                flash('Imported');
              } catch (err) {
                flash(String(err));
              }
              e.target.value = '';
            }}
          />
        </label>
        <button className="chip" onClick={() => screenshotCanvas()}>
          Screenshot
        </button>
        <button className="chip" onClick={undo}>
          Undo
        </button>
        <button className="chip" onClick={redo}>
          Redo
        </button>
        <Link className="chip" to="/editor">
          Plan Editor
        </Link>
      </div>

      {msg && <div className="toast">{msg}</div>}
      {viewMode === 'walk' && (
        <div className="hint">Click canvas to look · WASD to move · Esc to release mouse</div>
      )}
    </header>
  );
}
