import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type PlayerRef = {
  id: string;
  username: string;
};

export async function getPlayers(): Promise<{ players: PlayerRef[]; error: string | null }> {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from('players')
    .select('id, username')
    .order('username');
  return {
    players: (data ?? []) as PlayerRef[],
    error: error?.message ?? null,
  };
}
