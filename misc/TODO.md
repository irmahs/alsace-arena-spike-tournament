# Project TODO (Kanban)

## To do

### Setup & Infrastructure

- [ ] Create Supabase schema for:
  - participants
  - matches
  - games
  - scores
  - match roster / availability

### Core Features

- [ ] Build the public player scoreboard view.
- [ ] Build the full scoreboard with match-level breakdown.
- [ ] Build the match listing for matches 1–8.
- [ ] Add game detail views for matches 1–8 (3 games each).
- [ ] Build the match 9 final view with top-10 roster display.
- [ ] Implement score aggregation logic:
  - [ ] game → match total
  - [ ] match total → season total
- [ ] Implement top-10 lock logic based on matches 1–8.
- [ ] Add substitution logic for unavailable finalists.
- [ ] Secure admin-only access for score entry and roster changes.

### Privacy & Data Security

- [ ] Ensure public APIs never expose participant legal names.
- [ ] Store legal name in the database, but only return it through admin-protected endpoints.
- [ ] Confirm that public UI/API responses expose only:
  - display name
  - in-game name
  - Discord handle

### Admin Experience

- [ ] Add authenticated admin login.
- [ ] Add admin dashboard for:
  - entering and editing scores
  - marking player availability / absence
  - managing roster and match assignments
- [ ] Add validation for score entry and roster changes.

### UX & UI

- [ ] Create clear navigation between public scoreboard, full scoreboard, match list, and final match.
- [ ] Ensure mobile-responsive layout across views.
- [ ] Add visual clarity for public vs admin sections.

### Deployment

- [ ] Choose hosting for the Next.js app.
- [ ] Configure production Supabase environment variables.
- [ ] Deploy the application to a public URL.

## In progress

## Done

- [x] Create Supabase account and database.
- [x] Set up Supabase client with SSR support (`@supabase/ssr`).
- [x] Configure environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- [x] Connect app to Supabase and verify live data from `ranks` table.
- [x] Set up RLS policy for public read on `ranks`.
- [x] Initialize Next.js project structure with clean architecture (services, lib, types).
- [x] Add Tailwind CSS v4.

## Backlog / Future

- [ ] Add participant profile pages exposing public fields only.
- [ ] Add a countdown or next-match reminder.
- [ ] Add support for match history beyond the current season.
- [ ] Add optional participant login for read-only personalized views.

## Notes for the Developer

- Keep score entry strictly admin-only; participants should never self-submit.
- Treat legal name as a sensitive field and gate it at the API/data layer.
- Focus on data integrity first, then polish UI/UX afterward.
