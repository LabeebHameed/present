# ClassTrack

A timetable-aware attendance tracker and planner for college students. Goes beyond a percentage counter: automatic per-period tracking from your weekly timetable, duty leave with proof attachments, teacher substitutions, cancelled classes, a safe-to-miss/need-to-attend calculator, and a "what happens if…" simulator for planning ahead.

Installable, offline-first PWA. All data stays on-device (IndexedDB) with JSON export/import for backup.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Dexie.js (IndexedDB) for local storage
- React Router
- Recharts for statistics
- Vitest for the attendance-calculation engine, Playwright for end-to-end flows

## Architecture

- `src/engine/` — pure, framework-free attendance math (schedule expansion, stats, safe-to-miss, simulator). No React or Dexie imports here; every formula is unit-tested in isolation.
- `src/db/` — Dexie schema and types.
- `src/features/` — one folder per screen (today, setup, calendar, analytics, simulator, stats, report, settings).
- `src/components/` — shared UI.

## Development

```bash
npm install
npm run dev         # start dev server
npm run typecheck   # tsc -b
npm run lint        # oxlint
npm run test        # vitest (attendance engine)
npm run test:e2e    # playwright end-to-end flows
npm run build        # production build (includes typecheck)
```
