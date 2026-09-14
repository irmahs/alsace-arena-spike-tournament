# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A public scoreboard for a monthly Valorant ("Spike") tournament at Alsace Arena. It reads
season/match/game stats from Supabase and renders leaderboards and stat tables. Live at
https://alsace-arena-spike-tournament.vercel.app/ (Vercel). The public site has a light/dark
theme toggle and an English/French language toggle in the header. `/admin` (Supabase auth) has
a score-entry form — 10 rows, player-name autocomplete, one-click bonus check — that writes
`game_stats`. It can optionally scan a scoreboard screenshot with Claude vision, behind a
feature flag that's currently off. See `misc/TODO.md` for roadmap.

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
  - `/` (`page.tsx`) — podium (MVP + silver + bronze from `seasonTotals[0..2]`) + match tabs.
    Only matches that **have games recorded** appear (`getGameCounts`); tabs = `playedMatches`.
    "All matches" tab = season-wide global leaderboard; a match tab = that single match, with a
    "Match detail →" link. Same cumulative-stats table via `getPlayerTotals`; empty table
    (headers only) when no stats. Auto-redirects to `?currentSeason=<maxSeason>` when missing.
  - `/matches` — match grid (all matches of the latest season).
  - `/matches/[season]/[matchId]` — match detail. Uses `getPlayerTotals([matchId])` for the
    combined table (no local scoring), `getGames` for the game tabs (variable 2–5, data-driven).
    Header: "Most Valuable Player" card (`displayPlayers[0]` + stats) then `<StatLeaders>`
    (client) — a 6-card carousel, 3 at a time, naming the leader for least deaths / most
    kills / assists / first bloods / plants / defuses.
  - `/matches/[season]/[matchId]/[game]` — single-game stats; same MVP + `<StatLeaders>` header.
  - `/admin` (`page.tsx` + `components/ScoreEntry.tsx`, client) — score-entry form. Guarded by
    `getAdminUser()`, `redirect('/')` when unauthorized. Flow: season (1..maxSeason+buffer),
    match (1–8), game (1–5) — plain `<select>`s, none pulled from the DB (the header's season
    dropdown, by contrast, only lists seasons that exist). The table starts pre-filled with
    **10 empty rows** (no "+ row" control). Each row's **Player** cell is a `<select>` of
    existing players by default (`players.username` only — `players` has no `in_game_name`
    column, a real bug hit while building this: `getPlayers()` originally selected it and
    every fetch silently 500'd); a **"New"** checkbox switches it to a **Username** text input
    instead, and on save `saveGameStats` inserts that player into `players` first and uses the
    new id — no separate "linked player" control, no free-text name matching. The 8 stat
    `<input type="number">`s have their native spin buttons removed
    globally (`globals.css` targets `input[type='number']` + its `::-webkit-inner/outer-spin-button`
    — a Tailwind arbitrary-variant version of this on the input itself did not work reliably,
    hence the plain CSS). If `getPlayers()` returns none, `players.length === 0` shows an
    inline warning (check RLS / step 9) instead of a silently-empty dropdown.
    Once the numbers are in, **Calculate bonuses** (bottom action row) ticks every bonus except
    victory (first blood / least deaths / most assists / most plants / most defuses, all by
    max/min, ties allowed); those 5 checkboxes are rendered `disabled` — visible but not
    user-editable, the button is the only way to set them. **Win** stays a normal,
    manually-checkable checkbox per row; none ticked = no +50.
    Picking a full season+match+game triggers a `useEffect` that calls `loadGameStats` — if
    that combo already has saved `game_stats`, the rows are replaced with the real data
    (padded to 10 with empty rows) and a "editing a saved entry" badge appears; otherwise the
    10 rows reset to blank. **Save game**/**Save changes** calls `saveGameStats`, which
    resolves any new-player rows, then finds-or-creates the `matches` row (by season + number),
    then the `games` row, then replaces its `game_stats` — so re-saving the same combo is how
    edits are persisted. **Delete game** (enabled only when a saved entry is loaded) calls
    `deleteGameStats`, which deletes the `game_stats` and the `games` row itself, after a
    `window.confirm()`. Needs `misc/admin-setup.sql` steps 5–9 (RLS, `(match_season,
    match_number)` unique, dropping `is_final` + match 9, widening `games.game_number` to 1–5,
    admin insert on `players`) — all four tables (`matches`, `games`, `game_stats`, `players`)
    need the admin write policy or save/delete fails with "new row violates row-level security
    policy".
    Uploading a screenshot to auto-fill the rows via Claude vision still exists but is gated
    behind `SCOREBOARD_SCAN_ENABLED` in `src/constants/flags.ts` — **currently `false`**.
  - Login is **not a page** — the "Admin" nav item (`components/AdminMenu.tsx`, client) opens a
    `<dialog>` modal that signs in with the **browser** Supabase client
    (`supabase.auth.signInWithPassword`), checks `profiles.is_admin` (signs out + errors if
    not), then `router.refresh()` + `router.push('/admin')`. The layout passes `isAdmin` so the
    nav item becomes a link once signed in. DB/RLS setup for admins: `misc/admin-setup.sql`.
- `src/app/api/admin/scan-scoreboard/route.ts` — the only API route (dead while
  `SCOREBOARD_SCAN_ENABLED` is `false` — the UI that calls it isn't rendered). `nodejs` runtime,
  admin-guarded. Sends the uploaded image to `claude-opus-5` with a `strict` forced tool
  (`record_scoreboard`) and returns its JSON `{ players: [...] }`. Picture row format:
  `username  combatscore  kills/deaths/assists  econ  firstblood  plant  defuse`.
- `src/constants/flags.ts` — feature flags. `SCOREBOARD_SCAN_ENABLED` (currently `false`) gates
  the screenshot-scan UI + route above.
- `src/services/` — one module per concern (`matches.ts`, `games.ts`, `gameStats.ts`,
  `players.ts` — `getPlayers()` id/username (that's the whole `players` table this app reads —
  don't add columns to the select without confirming they exist; see the admin section above),
  `matchScores.ts` —
  `getPlayerTotals(matchIds[])` aggregates cumulative stats + total points; one id = a match
  table, all season ids = the home "All matches" leaderboard). Every function creates a fresh
  server client with `createClient(await cookies())` and returns `{ data, error: string | null }`.
- `src/lib/supabase/` — `client.ts` (browser), `server.ts` (RSC/server), `auth.ts`
  (`getAdminUser()` — session user gated on `profiles.is_admin`), `middleware.ts` (session
  refresh helper — **currently unused; there is no root `middleware.ts`, so sessions are not
  auto-refreshed**).
- `src/types/index.ts` — domain model mirroring the DB.
- `src/components/` — client components, all `'use client'` (`NavLinks.tsx`, wrapped in
  `<Suspense>` for `useSearchParams`; `AdminMenu.tsx` login modal; `ScoreEntry.tsx` score form;
  `StatLeaders.tsx` category-leader carousel; `ThemeToggle.tsx`, `LanguageToggle.tsx`).
  `AdminMenu` is the only user of the browser Supabase client; `ScoreEntry` talks to the API
  route + the server action.

### Theme (light/dark)

Every color in the app is a CSS variable defined in `globals.css` — `:root` (dark, the
original look, values unchanged) and `:root[data-theme='light']` (the alternate palette).
Components reference them as Tailwind arbitrary values, e.g. `bg-[var(--surface)]`,
`text-[var(--text-strong)]`, never a literal hex — **when adding UI, use an existing `--token`
from `globals.css` or add a new one there; don't hard-code a hex.** The 3 buttons on a solid
`bg-[var(--accent)]` background (`AdminMenu` "Sign in", `ScoreEntry` "Upload & scan"/"Save
game") keep literal `text-white` on purpose — that label must stay legible against the accent
red in both themes, not invert with it.

`components/ThemeToggle.tsx` flips `document.documentElement.dataset.theme` and persists the
choice to `localStorage['theme']`. `layout.tsx` inlines a tiny blocking `<script>`
(`THEME_INIT_SCRIPT`) as the first thing in `<body>` that reads that key and sets the attribute
*before paint*, so there's no flash of the wrong theme. `[color-scheme:var(--scheme)]` (in
`ScoreEntry.tsx`'s `select`/`cellInput` classes) keeps native `<select>`/spinner chrome in sync
with the theme too — don't hard-code `[color-scheme:dark]` again.

### Internationalization (English / French)

`src/i18n/dictionary.ts` — `Locale = 'en' | 'fr'`, a plain nested dictionary object (strings
and small interpolation functions like `t.match(n)`), and `getDictionary(locale)`. No
`next/headers` import here on purpose, so client components can import it directly.
`src/i18n/locale.ts` — `getLocale()`, **server-only** (reads the `lang` cookie via
`next/headers`); Server Component pages call `const t = getDictionary(await getLocale())`.
`components/LanguageToggle.tsx` (client) sets `document.cookie = 'lang=en'|'lang=fr'` and calls
`router.refresh()` so the next server render picks it up — locale is cookie-based, not
localStorage, precisely because the translated text is rendered server-side.

**Translated:** `layout.tsx`/`NavLinks.tsx` (nav, season labels), `/` , `/matches`,
`/matches/[season]/[matchId]` (+ `.../[game]`) — i.e. the whole public site. Column-abbreviation
headers (ACS/K/D/A/Eco/FB/Pl./Def./Pts) are deliberately left as-is in both languages (universal
esports shorthand). **Not translated (English only, on purpose):** the admin login modal
(`AdminMenu.tsx`) and the score-entry form (`ScoreEntry.tsx`) — an admin-only internal tool,
scoped out to keep the public-facing translation complete and correct rather than spreading
thin; extend it the same way (import the dictionary, add keys) if that's ever needed.

### Scoring

`src/constants/scoring.ts` — `POINTS_PER_BONUS = 10`, `POINTS_PER_WIN = 50`, and
**`computeScore()`** — the intended single source of truth:

```
total = acs + kills + assists + econ_rating + first_bloods + plants + defuses
      + bonus_count * POINTS_PER_BONUS  - deaths  + wins * POINTS_PER_WIN
```

`ScoreEntry.tsx` uses `computeScore()`. The combined match-detail page and the home leaderboard
get their totals from `services/matchScores.getPlayerTotals` (which still **inlines** the
formula). The per-game page `matches/[season]/[matchId]/[game]/page.tsx` also **inlines** it.
Migrate both to `computeScore()` when touching them; until then a formula change must land in
all three places.

### Data model (Supabase, `misc/database.sql` — reference only, not runnable)

`ranks` → `players` (uuid PK, `current_rank_id` FK) → `matches` (`match_number` 1–8,
`match_season`, unique on the pair) → `games` (1–5 per match, variable) → `game_stats` (one row per
player per game; all the stat + bonus columns). `profiles.is_admin` gates `/admin`. RLS is on:
public read everywhere; **admins need write policies on `matches` + `games` + `game_stats`**
for score entry (`misc/admin-setup.sql` steps 5–8). No `is_final` — the "final match" concept
was removed. On the home page a match counts as "played" when it has ≥1 `games` row; elsewhere
`match_date != null` marks a match as done.

## Conventions

- 2-space indent for `.ts`/`.tsx` (`.vscode/settings.json`).
- `globals.css` is `@import "tailwindcss"` + the `@theme` font var + the light/dark `--token`
  definitions (see Theme section above) + one plain-CSS rule (hides number-input spinners —
  Tailwind arbitrary variants on the class didn't reliably do it). Otherwise all styling is
  inline Tailwind utilities using `var(--token)` arbitrary values, never a literal hex.
  `font-display` = Rajdhani, body = Inter, both via `next/font/google` in `layout.tsx`.
- `layout.tsx` keeps `suppressHydrationWarning` on `<html>` (browser-extension noise).
- Fetch match/game data in `services/`, never inline in a component. Parallelize with
  `Promise.all` (see the match detail pages).
