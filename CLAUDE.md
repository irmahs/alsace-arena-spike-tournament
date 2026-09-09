# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A public scoreboard for a monthly Valorant ("Spike") tournament at Alsace Arena. It reads
season/match/game stats from Supabase and renders leaderboards and stat tables. Live at
https://alsace-arena-spike-tournament.vercel.app/ (Vercel). `/admin` (Supabase auth) has a
score-entry form that scans a scoreboard screenshot with Claude vision and writes `game_stats`.
See `misc/TODO.md` for roadmap.

## Commands

```bash
npm run dev     # dev server at http://localhost:3000
npm run build   # production build + full TypeScript check — the pre-commit gate
npm start       # serve a production build
```

`npm run lint` is **broken** — Next 16 removed `next lint`. The `.eslintrc.json`
(`next/core-web-vitals`) is still there but there's no working runner; rely on `npm run build`
for type errors.

No test runner is set up. `.env.local` needs `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `ANTHROPIC_API_KEY` (server-only; the scoreboard
scan route fails with a clear 500 if unset).

`.devcontainer/` defines a cloud dev container (GitHub Codespaces / any devcontainer host):
Node 22, `npm install`, and `.devcontainer/setup.sh` regenerates `.env.local` from the host's
secrets. Supabase is already hosted — nothing to run locally for it.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Supabase via
`@supabase/ssr` · `@tabler/icons-react` · `@anthropic-ai/sdk` (scoreboard OCR). Path alias
`@/*` → `src/*`.

## Architecture

**Layered, server-first. Pages are thin; all data access lives in `src/services/`.**

- `src/app/` — routing only. Every page is an async Server Component. Route params and
  `searchParams` are Promises in Next 16 and must be awaited.
  - `/` (`page.tsx`) — match tabs + sidebar. Every tab renders the same cumulative-stats table
    via `getPlayerTotals`: "All matches" = season-wide global leaderboard (all regular matches);
    a match tab or the "Final ★" tab = that single match, with a "Match detail →" link. Renders
    an empty table (headers only) when no stats exist. Auto-redirects to
    `?currentSeason=<maxSeason>` when the param is missing.
  - `/matches` — match grid.
  - `/matches/[season]/[matchId]` — match detail: stats **aggregated across all 3 games**.
  - `/matches/[season]/[matchId]/[game]` — single-game player stats.
  - `/admin` (`page.tsx` + `components/ScoreEntry.tsx`, client) — score-entry form. Guarded by
    `getAdminUser()`, `redirect('/')` when unauthorized. Flow: season (1..maxSeason+buffer),
    match (1–9), game (1–3) — plain `<select>`s, none pulled from the DB → upload a screenshot →
    `POST /api/admin/scan-scoreboard` (Claude vision, forced tool call) returns 10 rows → each
    scanned name is matched against `players.username` / `players.in_game_name`
    (case-insensitive); no match = a ⚠ flag with the raw name kept in an editable textbox + a
    player `<select>` → least-deaths / most-assists / most-plants / most-defuses bonuses are
    auto-ticked (first-blood and win stay manual; no win ticked = no +50) → **Save game** calls
    the `saveGameStats` server action in `app/admin/actions.ts`, which finds-or-creates the
    `matches` row (by season + number, `is_final` when number 9), then the `games` row, then
    replaces its `game_stats`. Needs `misc/admin-setup.sql` steps 5–6 (RLS + a
    `(match_season, match_number)` unique constraint replacing the lone `match_number` one).
  - Login is **not a page** — the "Admin" nav item (`components/AdminMenu.tsx`, client) opens a
    `<dialog>` modal that signs in with the **browser** Supabase client
    (`supabase.auth.signInWithPassword`), checks `profiles.is_admin` (signs out + errors if
    not), then `router.refresh()` + `router.push('/admin')`. The layout passes `isAdmin` so the
    nav item becomes a link once signed in. DB/RLS setup for admins: `misc/admin-setup.sql`.
- `src/app/api/admin/scan-scoreboard/route.ts` — the only API route. `nodejs` runtime,
  admin-guarded. Sends the uploaded image to `claude-opus-5` with a `strict` forced tool
  (`record_scoreboard`) and returns its JSON `{ players: [...] }`. Picture row format:
  `username  combatscore  kills/deaths/assists  econ  firstblood  plant  defuse`.
- `src/services/` — one module per concern (`matches.ts`, `games.ts`, `gameStats.ts`,
  `players.ts` — `getPlayers()` id/username/in_game_name, `matchScores.ts` —
  `getPlayerTotals(matchIds[])` aggregates cumulative stats + total points; one id = a match
  table, all season ids = the home "All matches" leaderboard). Every function creates a fresh
  server client with `createClient(await cookies())` and returns `{ data, error: string | null }`.
- `src/lib/supabase/` — `client.ts` (browser), `server.ts` (RSC/server), `auth.ts`
  (`getAdminUser()` — session user gated on `profiles.is_admin`), `middleware.ts` (session
  refresh helper — **currently unused; there is no root `middleware.ts`, so sessions are not
  auto-refreshed**).
- `src/types/index.ts` — domain model mirroring the DB.
- `src/components/` — client components, all `'use client'` (`NavLinks.tsx`, wrapped in
  `<Suspense>` for `useSearchParams`; `AdminMenu.tsx` login modal; `ScoreEntry.tsx` score form).
  `AdminMenu` is the only user of the browser Supabase client; `ScoreEntry` talks to the API
  route + the server action.

### Scoring

`src/constants/scoring.ts` — `POINTS_PER_BONUS = 10`, `POINTS_PER_WIN = 50`, and
**`computeScore()`** — the intended single source of truth:

```
total = acs + kills + assists + econ_rating + first_bloods + plants + defuses
      + bonus_count * POINTS_PER_BONUS  - deaths  + wins * POINTS_PER_WIN
```

`ScoreEntry.tsx` uses `computeScore()`. The two match page components
(`matches/[season]/[matchId]/page.tsx`, `.../[game]/page.tsx`) and `services/matchScores.ts`
still **inline their own copy** of the same formula — migrate them to `computeScore()` when
touching them; until then, any change to the formula must land in all four places.

### Data model (Supabase, `misc/database.sql` — reference only, not runnable)

`ranks` → `players` (uuid PK, `current_rank_id` FK) → `matches` (1–9, `is_final`, `match_season`)
→ `games` (1–3 per match) → `game_stats` (one row per player per game; all the stat + bonus
columns). `profiles.is_admin` gates `/admin`. RLS is on: public read everywhere; **admins need
write policies on `games` + `game_stats`** for score entry (`misc/admin-setup.sql` step 5). A
match is "played" when `match_date` is non-null.

## Conventions

- 2-space indent for `.ts`/`.tsx` (`.vscode/settings.json`).
- `globals.css` holds only `@import "tailwindcss"` + the `@theme` font var; all styling is
  inline Tailwind utilities with hard-coded hex colors (dark theme, `#ff4655` accent).
  `font-display` = Rajdhani, body = Inter, both via `next/font/google` in `layout.tsx`.
- `layout.tsx` keeps `suppressHydrationWarning` on `<html>` (browser-extension noise).
- Fetch match/game data in `services/`, never inline in a component. Parallelize with
  `Promise.all` (see the match detail pages).
