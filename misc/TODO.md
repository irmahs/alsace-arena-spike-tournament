# Project TODO

## Done

- [x] Supabase setup (schema, RLS, SSR client, env vars)
- [x] Next.js project structure (services, lib, types, constants)
- [x] Navigation with season dropdown
- [x] Match list with status (done / upcoming) and sidebar
- [x] Match detail page — aggregated stats across all 3 games
- [x] Per-game stats page with player performance table
- [x] Scoring formula (ACS + K + A + Eco + FB + Pl. + Def. + bonuses − deaths + victories)
- [x] Bonus icons + legend (first blood, least deaths, most assists, plants, defuses, victory)
- [x] Season filtering on leaderboard

- [x] Admin auth (Supabase login modal + `is_admin` guard on `/admin`)
- [x] Admin score entry — season/match/game pickers, scan a scoreboard screenshot with Claude
      vision, editable 10-player table with player-name matching + flags, auto bonuses, save

## In progress

- [ ] Season leaderboard — player ranking table with cumulative points across all matches
- [ ] Home page match progression display (games played count per match)
- [ ] Final match (match 9) — top-10 roster display and substitution logic
- [ ] UI / UX polish to align all views

## To do

- [ ] Match dates — display and manage scheduled dates per match
- [ ] Admin — score *editing* (load an existing game back into the form), player availability,
      player CRUD, retain the uploaded screenshot
- [ ] Simplify home page URL — `/?currentSeason=8&tab=1&matchId=1&matchSeason=8` has redundant params, should collapse to something like `/?season=8&match=1`
- [x] Deployment — hosted on Vercel at https://alsace-arena-spike-tournament.vercel.app/

## Backlog

- [ ] Player profile pages
- [ ] Mobile responsiveness
- [ ] Match history across multiple seasons
