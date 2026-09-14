# Alsace Arena Spike Tournament

**Live site:** https://alsace-arena-spike-tournament.vercel.app/

A web application for tracking standings and match stats for a monthly Valorant competition at Alsace Arena.

Built with **Next.js**, **Tailwind CSS**, **Supabase**, and **Claude** (scoreboard OCR).

## What this app does

- Season leaderboard — cumulative player stats and points across every game of the season.
- Podium — MVP + silver + bronze of the season, shown above the leaderboard.
- Per-match and per-game stat tables, each led by a Most Valuable Player card and a
  carousel of category leaders (least deaths, most kills, assists, first bloods, plants, defuses).
- Season switcher in the header (only lists seasons that exist in the database).
- Light/dark theme toggle and English/French language toggle, both in the header — the public
  site (leaderboard, matches, match/game detail) is fully translated; the admin tool is English only.
- Admin area (`/admin`, Supabase auth) — enter a game's 10 player rows by hand: pick each
  player from a dropdown, or tick "New" to register one on the spot by username. One-click
  "Check bonuses" fills every bonus but victory. Uploading a screenshot for Claude to read
  instead is built in but off by default (feature flag).

## Scoring formula

```
Total = ACS + Kills + Assists + Eco + First bloods + Plants + Defuses
      + (bonus count × 10)
      − Deaths
      + (victories × 50)
```

Bonuses are awarded per game for: first blood, least deaths, most assists, most plants, most defuses.
A victory bonus applies only to players marked as winning that game — if no result is recorded, nobody gets it.

## Season structure

- A season is a set of matches (numbered 1–8); a match is **2–5 games** (varies by data).
- The leaderboard and podium are computed across every game of the season.
- Only matches with at least one game recorded appear on the leaderboard page.

## Tech stack

- **Next.js 16** (App Router, TypeScript, React 19)
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL, auth, RLS) via `@supabase/ssr`
- **`@anthropic-ai/sdk`** — `claude-opus-5` vision can read the scoreboard screenshot
  (feature-flagged off by default, see `src/constants/flags.ts`)

## Project structure

```
src/
  app/
    page.tsx                       — season leaderboard + MVP banner + match tabs
    matches/                       — match grid
    matches/[season]/[matchId]/    — match detail (all games combined, 2–5 per match)
      [game]/                      — individual game stats
    admin/                         — score-entry form (page.tsx) + save/load/delete actions.ts
    api/admin/scan-scoreboard/     — POST an image, Claude returns the 10 rows
  components/
    NavLinks.tsx                   — nav bar + season dropdown
    AdminMenu.tsx                  — login modal (browser Supabase client)
    ScoreEntry.tsx                 — the admin score-entry form
    StatLeaders.tsx                — category-leader carousel (match/game detail header)
    ThemeToggle.tsx, LanguageToggle.tsx
  constants/scoring.ts             — POINTS_PER_BONUS, POINTS_PER_WIN, computeScore()
  constants/flags.ts               — SCOREBOARD_SCAN_ENABLED feature flag
  i18n/dictionary.ts, locale.ts    — EN/FR strings + cookie-based locale
  lib/supabase/                    — client / server factories + auth.ts (getAdminUser)
  services/                        — data access (matches, games, gameStats, matchScores, players)
  types/                           — TypeScript domain model
```

## Theme & language

All colors are CSS variables (`src/app/globals.css`, dark by default, `[data-theme="light"]`
for the alternate palette) — components reference `var(--token)`, never a literal hex.
`ThemeToggle` flips `data-theme` on `<html>` and remembers it in `localStorage`. Language is a
`lang` cookie (`en`/`fr`, read server-side in `src/i18n/locale.ts`) so translated text renders
correctly in Server Components; `LanguageToggle` sets the cookie and refreshes.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ANTHROPIC_API_KEY=sk-ant-...        # only needed if SCOREBOARD_SCAN_ENABLED is turned on
   ```
3. Run the Supabase setup once: paste `misc/admin-setup.sql` into the Supabase SQL editor
   (creates the profile trigger, RLS policies, and the admin write access).
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000).

A cloud dev container is defined in `.devcontainer/` (GitHub Codespaces or any devcontainer host).

## Creating a new admin

There's no sign-up flow — admins are created by hand in Supabase, then promoted with SQL:

1. Supabase dashboard → **Authentication → Users → Add user** → enter their email + password,
   tick **Auto Confirm User**. (A `public.profiles` row is created for them automatically.)
2. In the Supabase **SQL editor**, run:
   ```sql
   update public.profiles p
   set is_admin = true
   from auth.users u
   where u.id = p.id
     and u.email = 'their-email@example.com';
   ```
3. They can now sign in from the **Admin** button in the header and reach `/admin`.

(See `misc/admin-setup.sql`, steps 3–4, for the same instructions alongside the rest of the
one-time RLS/schema setup.)
