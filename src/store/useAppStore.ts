import { create } from 'zustand';
import type { DesignScheme, FaceFinish, FloorPlan } from '../types/floor';
import { floors as authoredFloors } from '../data/floors';
import { LEVELS } from '../data/grid';

export type ViewMode = 'walk' | 'dollhouse';

interface AppState {
  floors: FloorPlan[];
  currentLevel: string;
  viewMode: ViewMode;
  selectedFaceId: string | null;
  selectedRoomId: string | null;
  scheme: DesignScheme;
  history: DesignScheme[];
  future: DesignScheme[];
  clipboard: FaceFinish | null;
  playerYaw: number;
  playerPos: [number, number, number];
  showCeilings: boolean;
  showMinimap: boolean;

  setLevel: (level: string) => void;
  setViewMode: (mode: ViewMode) => void;
  selectFace: (faceId: string | null) => void;
  selectRoom: (roomId: string | null) => void;
  setPlayer: (pos: [number, number, number], yaw?: number) => void;
  setShowCeilings: (v: boolean) => void;
  setShowMinimap: (v: boolean) => void;

  applyFaceFinish: (faceId: string, finish: FaceFinish) => void;
  applyRoomFinish: (roomId: string, surface: 'floor' | 'ceiling', finish: FaceFinish) => void;
  applyFinishToRoomWalls: (roomId: string, level: string, finish: FaceFinish) => void;
  copyFinish: (faceId: string) => void;
  pasteFinish: (faceId: string) => void;
  undo: () => void;
  redo: () => void;
  loadScheme: (scheme: DesignScheme) => void;
  renameScheme: (name: string) => void;
  setImage: (id: string, dataUrl: string) => void;
  replaceFloor: (plan: FloorPlan) => void;
  getFloor: () => FloorPlan;
}

function emptyScheme(name = 'Untitled Scheme'): DesignScheme {
  return {
    id: crypto.randomUUID(),
    name,
    updatedAt: Date.now(),
    faces: {},
    rooms: {},
    images: {},
  };
}

function pushHistory(state: AppState): Pick<AppState, 'history' | 'future' | 'scheme'> {
  return {
    history: [...state.history.slice(-49), state.scheme],
    future: [],
    scheme: { ...state.scheme, updatedAt: Date.now() },
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  floors: authoredFloors,
  currentLevel: '3',
  viewMode: 'dollhouse',
  selectedFaceId: null,
  selectedRoomId: null,
  scheme: emptyScheme('Pearl Fit-Up'),
  history: [],
  future: [],
  clipboard: null,
  playerYaw: 0,
  playerPos: [13, mmElev('3') + 1.6, 18],
  showCeilings: false,
  showMinimap: true,

  setLevel: (level) => {
    const plan = get().floors.find((f) => f.level === level);
    if (!plan) return;
    const elev = plan.elevation / 1000;
    const room = plan.rooms[0];
    let x = 13;
    let z = 18;
    if (room) {
      const xs = room.polygon.map((p) => p[0]);
      const ys = room.polygon.map((p) => p[1]);
      x = (Math.min(...xs) + Math.max(...xs)) / 2000;
      z = (Math.min(...ys) + Math.max(...ys)) / 2000;
    }
    set({
      currentLevel: level,
      playerPos: [x, elev + 1.6, z],
      selectedFaceId: null,
    });
  },

  setViewMode: (viewMode) => set({ viewMode }),
  selectFace: (selectedFaceId) => set({ selectedFaceId, selectedRoomId: null }),
  selectRoom: (selectedRoomId) => set({ selectedRoomId, selectedFaceId: null }),
  setPlayer: (playerPos, yaw) =>
    set(yaw !== undefined ? { playerPos, playerYaw: yaw } : { playerPos }),
  setShowCeilings: (showCeilings) => set({ showCeilings }),
  setShowMinimap: (showMinimap) => set({ showMinimap }),

  applyFaceFinish: (faceId, finish) => {
    const state = get();
    const hist = pushHistory(state);
    set({
      ...hist,
      scheme: {
        ...hist.scheme,
        faces: { ...hist.scheme.faces, [faceId]: finish },
      },
    });
  },

  applyRoomFinish: (roomId, surface, finish) => {
    const state = get();
    const hist = pushHistory(state);
    const prev = hist.scheme.rooms[roomId] ?? {};
    set({
      ...hist,
      scheme: {
        ...hist.scheme,
        rooms: {
          ...hist.scheme.rooms,
          [roomId]: { ...prev, [surface]: finish },
        },
      },
    });
  },

  applyFinishToRoomWalls: (roomId, level, finish) => {
    const plan = get().floors.find((f) => f.level === level);
    if (!plan) return;
    const room = plan.rooms.find((r) => r.id === roomId);
    if (!room) return;
    // Apply to all wall faces whose midpoint is near the room bbox
    const xs = room.polygon.map((p) => p[0]);
    const ys = room.polygon.map((p) => p[1]);
    const minX = Math.min(...xs) - 200;
    const maxX = Math.max(...xs) + 200;
    const minY = Math.min(...ys) - 200;
    const maxY = Math.max(...ys) + 200;
    const state = get();
    const hist = pushHistory(state);
    const faces = { ...hist.scheme.faces };
    for (const w of plan.walls) {
      const mx = (w.a[0] + w.b[0]) / 2;
      const my = (w.a[1] + w.b[1]) / 2;
      if (mx >= minX && mx <= maxX && my >= minY && my <= maxY) {
        faces[`${w.id}:A`] = finish;
        faces[`${w.id}:B`] = finish;
      }
    }
    set({ ...hist, scheme: { ...hist.scheme, faces } });
  },

  copyFinish: (faceId) => {
    const f = get().scheme.faces[faceId];
    if (f) set({ clipboard: f });
  },

  pasteFinish: (faceId) => {
    const clip = get().clipboard;
    if (!clip) return;
    get().applyFaceFinish(faceId, { ...clip });
  },

  undo: () => {
    const { history, scheme, future } = get();
    if (!history.length) return;
    const prev = history[history.length - 1];
    set({
      history: history.slice(0, -1),
      future: [scheme, ...future],
      scheme: prev,
    });
  },

  redo: () => {
    const { history, scheme, future } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      history: [...history, scheme],
      future: future.slice(1),
      scheme: next,
    });
  },

  loadScheme: (scheme) => set({ scheme, history: [], future: [], selectedFaceId: null }),
  renameScheme: (name) => set({ scheme: { ...get().scheme, name, updatedAt: Date.now() } }),
  setImage: (id, dataUrl) =>
    set({
      scheme: {
        ...get().scheme,
        images: { ...get().scheme.images, [id]: dataUrl },
        updatedAt: Date.now(),
      },
    }),

  replaceFloor: (plan) => {
    const floors = get().floors.map((f) => (f.level === plan.level ? plan : f));
    set({ floors });
  },

  getFloor: () => {
    const { floors, currentLevel } = get();
    return floors.find((f) => f.level === currentLevel) ?? floors[0];
  },
}));

function mmElev(level: string): number {
  return (LEVELS.find((l) => l.level === level)?.elevation ?? 0) / 1000;
}

export { emptyScheme };
