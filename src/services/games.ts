import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Game } from '@/types';

export async function getGames(matchId: number): Promise<{ games: Game[]; error: string | null }> {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from('games')
    .select('id, match_id, game_number')
    .eq('match_id', matchId)
    .order('game_number');
  return {
    games: (data ?? []) as Game[],
    error: error?.message ?? null,
  };
}
