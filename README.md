# Alsace Arena Spike Tournament

**Live site:** https://alsace-arena-spike-tournament.vercel.app/

A web application for tracking standings and match stats for a monthly Valorant competition at Alsace Arena.

Built with **Next.js**, **Tailwind CSS**, and **Supabase**.

## What this app does

- Season leaderboard with per-season filtering via a season dropdown.
- Match list with status (done / upcoming) and a sidebar for quick navigation.
- Match detail page with aggregated stats across all 3 games.
- Per-game stats page with individual player performance.
- Scoring system based on in-game stats + bonuses + victories.

## Scoring formula

```
Total = ACS + Kills + Assists + Eco + First bloods + Plants + Defuses
      + (bonus count × 10)
      − Deaths
      + (victories × 50)
```

Bonuses are awarded per game for: first blood, least deaths, most assists, most plants, most defuses.

## Season structure

- **9 matches** per season, each with **3 games**.
- Matches 1–8 are regular rounds; match 9 is the **final** for the top 10 players.
- Final roster is locked after match 8, with next-ranked substitutions for absent players.

## Tech stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL, auth, API) via `@supabase/ssr`

## Project structure

```
src/
  app/                          — pages and layouts
    page.tsx                    — season leaderboard
    matches/[season]/[matchId]/ — match detail (all games combined)
      [game]/                   — individual game stats
  components/
    NavLinks.tsx                — nav bar with season dropdown
  constants/
    scoring.ts                  — POINTS_PER_BONUS, POINTS_PER_WIN
  lib/supabase/                 — Supabase client factories (browser, server, middleware)
  services/                     — data access layer (matches, games, game stats)
  types/                        — TypeScript domain model
```

## Getting started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).
