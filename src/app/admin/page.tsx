import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/supabase/auth';
import { getMatches } from '@/services/matches';
import { getPlayers } from '@/services/players';
import ScoreEntry from '@/components/ScoreEntry';

export default async function AdminPage() {
  const user = await getAdminUser();
  if (!user) redirect('/');

  const [{ matches }, { players, error: playersError }] = await Promise.all([
    getMatches(),
    getPlayers(),
  ]);

  async function signOut() {
    'use server';
    const supabase = createClient(await cookies());
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="px-7 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Admin</div>
          <h1 className="font-display text-[28px] font-bold leading-none tracking-[.02em] text-[var(--text-strong)]">
            Enter a game score
          </h1>
          <div className="mt-2 text-[13px] text-[var(--text-muted)]">Signed in as {user.email}</div>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-[var(--border)] px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[.04em] text-[var(--text-subtle)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-strong)]"
          >
            Sign out
          </button>
        </form>
      </div>

      <ScoreEntry matches={matches} players={players} playersError={playersError} />
    </div>
  );
}
