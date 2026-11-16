# Pearl Builders 3D Interior Walkthrough

Browser-based 3D interior design tool for **152 First Gulf Blvd, Brampton** (Pearl Builders Office Fit-Up), built from Ware Malcomb egress plans (`150FG.pdf`).

## Features

- All 6 floors (Basement → 5th) as a stacked shell model
- **Dollhouse** orbit view and **first-person walkthrough** (WASD + click-to-look)
- Click any wall face to apply **paint**, **wallpaper**, or an **uploaded photo**
- Floor / ceiling finishes per room; apply a finish to an entire room
- Floor switcher, room search / teleport, minimap
- Save design schemes to IndexedDB; export / import as ZIP; screenshot
- **Plan Tracing Editor** (`/editor`) with PDF underlay to refine walls, doors, and rooms

## Quick start

```bash
npm install
npm run export-floors
npm run dev
```

Open http://localhost:5173

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Export floors + production build |
| `npm run extract` | Draft PDF label extraction → `public/floors/*.draft.json` |
| `npm run export-floors` | Emit authored `src/data/floors` → `public/floors/*.json` |

## Data model

Authored floor plans live in `src/data/floors/*.ts` (millimetres, grid A–J / 1–12). Geometry is extruded at runtime by `src/geometry/buildWalls.ts`. Wall faces are addressable as `wallId:A` / `wallId:B` for independent finishes.

## Assumptions

- Clear ceiling height 2.7 m, floor-to-floor 4.2 m (editable in floor data)
- Sales Centre 102 / Design Centre 202 are open shells (consultant drawings not included)
- Window sizes on exterior walls are approximated
