import type { ReactNode } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PAINT_PALETTE, WALLPAPERS } from '../../data/textures';
import type { FaceFinish } from '../../types/floor';

export function FinishPanel() {
  const selectedFaceId = useAppStore((s) => s.selectedFaceId);
  const selectedRoomId = useAppStore((s) => s.selectedRoomId);
  const scheme = useAppStore((s) => s.scheme);
  const applyFaceFinish = useAppStore((s) => s.applyFaceFinish);
  const applyRoomFinish = useAppStore((s) => s.applyRoomFinish);
  const applyFinishToRoomWalls = useAppStore((s) => s.applyFinishToRoomWalls);
  const copyFinish = useAppStore((s) => s.copyFinish);
  const pasteFinish = useAppStore((s) => s.pasteFinish);
  const setImage = useAppStore((s) => s.setImage);
  const selectFace = useAppStore((s) => s.selectFace);
  const selectRoom = useAppStore((s) => s.selectRoom);
  const currentLevel = useAppStore((s) => s.currentLevel);
  const floors = useAppStore((s) => s.floors);

  if (!selectedFaceId && !selectedRoomId) {
    return (
      <aside className="panel">
        <h2>Finishes</h2>
        <p className="muted">
          Click a wall face to paint, wallpaper, or apply a photo. Click a floor slab to edit floor /
          ceiling finishes.
        </p>
      </aside>
    );
  }

  const plan = floors.find((f) => f.level === currentLevel);
  const room = selectedRoomId ? plan?.rooms.find((r) => r.id === selectedRoomId) : null;

  if (selectedRoomId && room) {
    const floorFinish = scheme.rooms[selectedRoomId]?.floor ?? { kind: 'paint' as const, color: '#C4B8A8' };
    const ceilFinish = scheme.rooms[selectedRoomId]?.ceiling ?? { kind: 'paint' as const, color: '#FAFAF8' };
    return (
      <aside className="panel">
        <div className="panel-head">
          <h2>
            {room.number} {room.name}
          </h2>
          <button className="icon-btn" onClick={() => selectRoom(null)}>
            ×
          </button>
        </div>
        <Section title="Floor">
          <PaintRow
            value={floorFinish}
            onChange={(f) => applyRoomFinish(selectedRoomId, 'floor', f)}
          />
        </Section>
        <Section title="Ceiling">
          <PaintRow
            value={ceilFinish}
            onChange={(f) => applyRoomFinish(selectedRoomId, 'ceiling', f)}
          />
        </Section>
        <Section title="Apply wall finish to whole room">
          <p className="muted small">Uses the finish currently on the clipboard (Copy a wall first).</p>
          <button
            className="btn"
            onClick={() => {
              const clip = useAppStore.getState().clipboard;
              if (clip) applyFinishToRoomWalls(selectedRoomId, currentLevel, clip);
            }}
          >
            Paste finish onto all room walls
          </button>
        </Section>
      </aside>
    );
  }

  const faceId = selectedFaceId!;
  const finish: FaceFinish = scheme.faces[faceId] ?? { kind: 'paint', color: '#F5F5F0' };

  const setFinish = (f: FaceFinish) => applyFaceFinish(faceId, f);

  return (
    <aside className="panel">
      <div className="panel-head">
        <h2>Wall face</h2>
        <button className="icon-btn" onClick={() => selectFace(null)}>
          ×
        </button>
      </div>
      <p className="mono small">{faceId}</p>

      <div className="tabs">
        {(['paint', 'wallpaper', 'photo'] as const).map((k) => (
          <button
            key={k}
            className={finish.kind === k ? 'chip active' : 'chip'}
            onClick={() => {
              if (k === 'paint') setFinish({ kind: 'paint', color: finish.color ?? '#F5F5F0' });
              if (k === 'wallpaper')
                setFinish({ kind: 'wallpaper', textureId: WALLPAPERS[0].id, scale: 2 });
              if (k === 'photo')
                setFinish({ kind: 'photo', imageId: finish.imageId, fit: 'stretch', scale: 1 });
            }}
          >
            {k}
          </button>
        ))}
      </div>

      {finish.kind === 'paint' && (
        <Section title="Paint">
          <div className="swatches">
            {PAINT_PALETTE.map((c) => (
              <button
                key={c}
                className="swatch"
                style={{ background: c }}
                title={c}
                onClick={() => setFinish({ kind: 'paint', color: c })}
              />
            ))}
          </div>
          <label className="field">
            Custom
            <input
              type="color"
              value={finish.color ?? '#F5F5F0'}
              onChange={(e) => setFinish({ kind: 'paint', color: e.target.value })}
            />
          </label>
        </Section>
      )}

      {finish.kind === 'wallpaper' && (
        <Section title="Wallpaper">
          <div className="wallpaper-grid">
            {WALLPAPERS.map((w) => (
              <button
                key={w.id}
                className={finish.textureId === w.id ? 'wallpaper active' : 'wallpaper'}
                style={{ background: w.baseColor }}
                onClick={() => setFinish({ ...finish, textureId: w.id })}
              >
                {w.name}
              </button>
            ))}
          </div>
          <label className="field">
            Tile scale
            <input
              type="range"
              min={0.5}
              max={6}
              step={0.1}
              value={finish.scale ?? 2}
              onChange={(e) => setFinish({ ...finish, scale: Number(e.target.value) })}
            />
          </label>
        </Section>
      )}

      {finish.kind === 'photo' && (
        <Section title="Photo">
          <label className="btn file-chip">
            Upload image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const id = crypto.randomUUID();
                  setImage(id, String(reader.result));
                  setFinish({
                    kind: 'photo',
                    imageId: id,
                    fit: finish.fit ?? 'stretch',
                    scale: finish.scale ?? 1,
                  });
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {finish.imageId && scheme.images[finish.imageId] && (
            <img className="preview" src={scheme.images[finish.imageId]} alt="Wall photo" />
          )}
          <div className="tabs">
            <button
              className={finish.fit !== 'tile' ? 'chip active' : 'chip'}
              onClick={() => setFinish({ ...finish, fit: 'stretch' })}
            >
              Stretch
            </button>
            <button
              className={finish.fit === 'tile' ? 'chip active' : 'chip'}
              onClick={() => setFinish({ ...finish, fit: 'tile' })}
            >
              Tile
            </button>
          </div>
          {finish.fit === 'tile' && (
            <label className="field">
              Scale
              <input
                type="range"
                min={0.5}
                max={8}
                step={0.1}
                value={finish.scale ?? 1}
                onChange={(e) => setFinish({ ...finish, scale: Number(e.target.value) })}
              />
            </label>
          )}
        </Section>
      )}

      <Section title="Actions">
        <div className="row">
          <button className="btn" onClick={() => copyFinish(faceId)}>
            Copy
          </button>
          <button className="btn" onClick={() => pasteFinish(faceId)}>
            Paste
          </button>
        </div>
        <button
          className="btn"
          onClick={() => {
            // Find room containing this wall midpoint and apply
            const wallId = faceId.replace(/:[AB]$/, '');
            const wall = plan?.walls.find((w) => w.id === wallId);
            if (!wall || !plan) return;
            const mx = (wall.a[0] + wall.b[0]) / 2;
            const my = (wall.a[1] + wall.b[1]) / 2;
            const roomHit = plan.rooms.find((r) => {
              const xs = r.polygon.map((p) => p[0]);
              const ys = r.polygon.map((p) => p[1]);
              return (
                mx >= Math.min(...xs) - 300 &&
                mx <= Math.max(...xs) + 300 &&
                my >= Math.min(...ys) - 300 &&
                my <= Math.max(...ys) + 300
              );
            });
            if (roomHit) applyFinishToRoomWalls(roomHit.id, currentLevel, finish);
          }}
        >
          Apply to whole room
        </button>
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function PaintRow({
  value,
  onChange,
}: {
  value: FaceFinish;
  onChange: (f: FaceFinish) => void;
}) {
  return (
    <>
      <div className="swatches">
        {PAINT_PALETTE.map((c) => (
          <button
            key={c}
            className="swatch"
            style={{ background: c }}
            onClick={() => onChange({ kind: 'paint', color: c })}
          />
        ))}
      </div>
      <input
        type="color"
        value={value.color ?? '#C4B8A8'}
        onChange={(e) => onChange({ kind: 'paint', color: e.target.value })}
      />
    </>
  );
}
