import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { RankRow } from '@/types';

export async function getRanks(): Promise<{ rows: RankRow[]; error: string | null }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.from('ranks').select('id, rank_name, rank_value');
  return {
    rows: (data ?? []) as RankRow[],
    error: error?.message ?? null,
  };
}
