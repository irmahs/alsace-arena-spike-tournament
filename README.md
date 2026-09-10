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
- Admin area (`/admin`, Supabase auth) — enter a game's scores by uploading a screenshot of the
  in-game scoreboard; Claude reads the 10 rows, they're matched to known players, and saved.

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
- **`@anthropic-ai/sdk`** — `claude-opus-5` vision reads the scoreboard screenshot

## Project structure

```
src/
  app/
    page.tsx                       — season leaderboard + MVP banner + match tabs
    matches/                       — match grid
    matches/[season]/[matchId]/    — match detail (all 3 games combined)
      [game]/                      — individual game stats
    admin/                         — score-entry form (page.tsx) + saveGameStats (actions.ts)
    api/admin/scan-scoreboard/     — POST an image, Claude returns the 10 rows
  components/
    NavLinks.tsx                   — nav bar + season dropdown
    AdminMenu.tsx                  — login modal (browser Supabase client)
    ScoreEntry.tsx                 — the admin score-entry form
  constants/scoring.ts             — POINTS_PER_BONUS, POINTS_PER_WIN, computeScore()
  lib/supabase/                    — client / server factories + auth.ts (getAdminUser)
  services/                        — data access (matches, games, gameStats, matchScores, players)
  types/                           — TypeScript domain model
```

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ANTHROPIC_API_KEY=sk-ant-...        # only needed for the admin scoreboard scan
   ```
3. Run the Supabase setup once: paste `misc/admin-setup.sql` into the Supabase SQL editor
   (creates the profile trigger, RLS policies, and the admin write access).
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000).

A cloud dev container is defined in `.devcontainer/` (GitHub Codespaces or any devcontainer host).
