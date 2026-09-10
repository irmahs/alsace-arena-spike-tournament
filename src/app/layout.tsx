import './globals.css';
import type { Metadata } from 'next';
import { Rajdhani, Inter } from 'next/font/google';
import NavLinks from '@/components/NavLinks';
import AdminMenu from '@/components/AdminMenu';
import { getMatches } from '@/services/matches';
import { getAdminUser } from '@/lib/supabase/auth';

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-rajdhani',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Alsace Arena Spike Tournament',
  description: 'Valorant season scoreboard and admin app',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ matches }, adminUser] = await Promise.all([getMatches(), getAdminUser()]);
  const seasons = [
    ...new Set(matches.map((m) => m.match_season).filter((s): s is number => s != null)),
  ].sort((a, b) => a - b);
  const season = seasons.length ? seasons[seasons.length - 1] : null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${rajdhani.variable} ${inter.variable}`}
    >
      <body className="bg-[#0d0f14] text-[#e2e4ea] min-h-screen" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
        <nav className="flex items-center justify-between px-7 py-3.5 bg-[#0a0c10] border-b border-[#1e2130]">
          <div
            className="flex items-center gap-2.5 font-display font-bold text-xl text-white"
          >
            <div
              className="w-7 h-7 bg-[#ff4655] flex-shrink-0"
              style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
            />
            SPIKE ALSACE ARENA
            <span className="text-[11px] font-medium text-[#ff4655] tracking-[.12em] uppercase ml-0.5">
              {season ? `Season ${season}` : 'Season —'}
            </span>
          </div>

          <NavLinks seasons={seasons} />

          <AdminMenu isAdmin={!!adminUser} />
        </nav>

        {children}
      </body>
    </html>
  );
}
