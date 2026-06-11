# Alsace Arena Spike Tournament

A web application for tracking the standings of a monthly Valorant competition at Alsace Arena.

Built with **Next.js**, **Tailwind CSS**, and **Supabase**.

## What this app does

- Displays a **public scoreboard** with ranked season totals.
- Provides a **full scoreboard** with match-level breakdowns.
- Shows **match details** for matches 1–8 and the championship match 9.
- Supports **admin score entry**, roster management, and substitution logic.
- Keeps score submission **admin-only** to prevent participant tampering.
- Exposes only public profile fields in the UI; **legal names remain admin-only**.

## Season structure

- **9 matches** across the season.
- Matches **1–8** are regular rounds with **3 games each**.
- Each game score contributes to a participant's **match total**.
- Match totals roll up to a **running season total**.
- **Match 9** is the final event for the **top 10 players**.
- Final roster is **locked after match 8**, with next-ranked substitutions if someone is unavailable.

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase** (database, auth, API) via `@supabase/ssr`

## Project structure

```
src/
  app/        — pages and layouts (routing only)
  lib/
    supabase/ — Supabase client factories (browser, server, middleware)
  services/   — data access layer
  types/      — TypeScript domain model
misc/
  TODO.md     — Kanban-style task board
```

## Getting started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Notes for developers

- Keep score entry and roster updates restricted to authenticated admin users.
- Never expose `legal_name` in public API responses.
- Focus on data integrity before UI polish.
- See `misc/TODO.md` for remaining tasks.
