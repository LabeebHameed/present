# ClassTrack

College attendance tracker/planner. React + TS + Vite PWA, Tailwind v4, Dexie (IndexedDB), local-only storage for v1.

## Hard rule: engine/UI separation

`src/engine/` must stay framework-free — no React, no Dexie imports. Every attendance calculation (schedule expansion, stats, safe-to-miss, need-to-attend, simulator, predictions) is a pure function there, covered by Vitest. UI code in `src/features/` and `src/components/` only calls into the engine; it never reimplements attendance math inline.

## Data model

See `src/db/types.ts` and `src/db/schema.ts`. Key idea: expected classes are *derived* from the timetable (`expandSchedule`), attendance records are *stored* (`ClassRecord`). A day's UI is expected periods left-joined with records — never store "what should happen," only "what did happen."

Duty-leave policy (`present` / `excluded` / `absent`) is a per-semester setting that changes how `computeStats` treats `dutyLeave` records — always read it from the semester, never hardcode a policy.

## Commands

- `npm run dev` / `npm run build` / `npm run preview`
- `npm run typecheck` — `tsc -b`
- `npm run lint` — oxlint
- `npm run test` — vitest, engine tests only (`src/engine/**/*.test.ts`)
- `npm run test:e2e` — playwright

## Plan

Full build plan lives in the project history; phases: 0 scaffold, 1 engine, 2 semester setup, 3 dashboard/daily marking, 4 analytics/settings, 5 calendar/overrides, 6 what-if simulator, 7 stats/report, 8 backup/search/notifications/deploy.
