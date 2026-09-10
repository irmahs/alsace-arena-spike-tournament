'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/supabase/auth';

export type SaveRow = {
  player_id: string;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  econ_rating: number;
  first_bloods: number;
  plants: number;
  defuses: number;
  win: boolean;
  bonus_fb: boolean;
  bonus_death: boolean;
  bonus_assist: boolean;
  bonus_plant: boolean;
  bonus_defuse: boolean;
};

export type SaveResult = { ok: boolean; error: string | null };

export async function saveGameStats(input: {
  season: number;
  matchNumber: number;
  gameNumber: number;
  rows: SaveRow[];
}): Promise<SaveResult> {
  if (!(await getAdminUser())) return { ok: false, error: 'Not authorized.' };

  const { season, matchNumber, gameNumber, rows } = input;
  if (!season || !matchNumber || !gameNumber) {
    return { ok: false, error: 'Pick a season, match and game.' };
  }
  if (matchNumber < 1 || matchNumber > 8 || gameNumber < 1 || gameNumber > 5) {
    return { ok: false, error: 'Match must be 1–8 and game 1–5.' };
  }
  if (rows.length === 0) return { ok: false, error: 'Nothing to save.' };
  if (rows.some((r) => !r.player_id)) {
    return { ok: false, error: 'Every row must be linked to a player.' };
  }
  const ids = rows.map((r) => r.player_id);
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: 'The same player is used on more than one row.' };
  }

  const supabase = createClient(await cookies());

  // Find or create the match row for this (season, match_number).
  let matchId: number;
  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select('id')
    .eq('match_season', season)
    .eq('match_number', matchNumber)
    .maybeSingle();
  if (matchErr) return { ok: false, error: matchErr.message };

  if (match) {
    matchId = match.id;
  } else {
    const { data: createdMatch, error: createMatchErr } = await supabase
      .from('matches')
      .insert({ match_season: season, match_number: matchNumber })
      .select('id')
      .single();
    if (createMatchErr || !createdMatch) {
      return {
        ok: false,
        error:
          createMatchErr?.message ??
          `Season ${season} match ${matchNumber} does not exist and could not be created.`,
      };
    }
    matchId = createdMatch.id;
  }

  // Find or create the games row for this (match, game_number).
  let gameId: number;
  const { data: existing, error: findErr } = await supabase
    .from('games')
    .select('id')
    .eq('match_id', matchId)
    .eq('game_number', gameNumber)
    .maybeSingle();
  if (findErr) return { ok: false, error: findErr.message };

  if (existing) {
    gameId = existing.id;
    // Re-entry replaces the previous stats for this game.
    const { error: delErr } = await supabase.from('game_stats').delete().eq('game_id', gameId);
    if (delErr) return { ok: false, error: delErr.message };
  } else {
    const { data: created, error: createErr } = await supabase
      .from('games')
      .insert({ match_id: matchId, game_number: gameNumber })
      .select('id')
      .single();
    if (createErr || !created) return { ok: false, error: createErr?.message ?? 'Could not create the game.' };
    gameId = created.id;
  }

  const { error: insertErr } = await supabase.from('game_stats').insert(
    rows.map((r) => ({
      game_id: gameId,
      player_id: r.player_id,
      acs: r.acs,
      kills: r.kills,
      deaths: r.deaths,
      assists: r.assists,
      econ_rating: r.econ_rating,
      first_bloods: r.first_bloods,
      plants: r.plants,
      defuses: r.defuses,
      win: r.win,
      bonus_fb: r.bonus_fb,
      bonus_death: r.bonus_death,
      bonus_assist: r.bonus_assist,
      bonus_plant: r.bonus_plant,
      bonus_defuse: r.bonus_defuse,
    })),
  );
  if (insertErr) return { ok: false, error: insertErr.message };

  revalidatePath('/', 'layout');
  return { ok: true, error: null };
}
