import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type PlayerRef = {
  id: string;
  username: string;
  in_game_name: string;
};

export async function getPlayers(): Promise<{ players: PlayerRef[]; error: string | null }> {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from('players')
    .select('id, username, in_game_name')
    .order('username');
  return {
    players: (data ?? []) as PlayerRef[],
    error: error?.message ?? null,
  };
}
