'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const badgeClass =
  'text-[11px] font-semibold text-[var(--accent)] border border-[var(--accent-33)] hover:border-[var(--accent-77)] px-2.5 py-1 rounded tracking-[.06em] uppercase transition-colors';

export default function AdminMenu({ isAdmin }: { isAdmin: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (isAdmin) {
    return (
      <a href="/admin" className={badgeClass}>
        Admin
      </a>
    );
  }

  function open() {
    setError(null);
    dialogRef.current?.showModal();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.user) {
      setError('Wrong email or password.');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single();

    if (!profile?.is_admin) {
      await supabase.auth.signOut();
      setError('That account is not an admin.');
      return;
    }

    dialogRef.current?.close();
    startTransition(() => {
      router.refresh();
      router.push('/admin');
    });
  }

  return (
    <>
      <button type="button" onClick={open} className={badgeClass}>
        Admin
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-5 backdrop:bg-black/60 open:flex"
      >
        <div className="max-h-full w-[380px] max-w-full overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg)] p-7">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Admin</div>
              <h2 className="font-display text-[20px] font-bold leading-none text-[var(--text-strong)]">Sign in</h2>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="text-[18px] leading-none text-[var(--text-muted)] hover:text-[var(--text-strong)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-[var(--accent-33)] bg-[var(--accent-0f)] px-3 py-2 text-[12px] text-[var(--accent)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--text-muted)]">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text)] focus:border-[var(--accent-55)] focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--text-muted)]">Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text)] focus:border-[var(--accent-55)] focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-md bg-[var(--accent)] px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[.04em] text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
