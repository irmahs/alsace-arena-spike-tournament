import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMatches } from '@/services/matches';
import type { Match } from '@/types';

const thClass = 'text-[11px] font-semibold text-[#3d4260] uppercase tracking-[.08em] pb-2.5 px-2.5 border-b border-[#1e2130]';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; currentSeason?: string }>;
}) {
  const { tab, currentSeason: currentSeasonParam } = await searchParams;
  const activeTab = tab ?? 'all';

  const { matches, error } = await getMatches();

  const allRegularMatches = matches.filter((m: Match) => !m.is_final);
  const maxSeason = matches.reduce((max: number, m: Match) => Math.max(max, m.match_season ?? 0), 0) || null;

  if (!currentSeasonParam && maxSeason) {
    const params = new URLSearchParams({ currentSeason: String(maxSeason) });
    if (tab) params.set('tab', tab);
    redirect(`/?${params.toString()}`);
  }

  const currentSeason = currentSeasonParam ? parseInt(currentSeasonParam) : maxSeason;

  const regularMatches = allRegularMatches.filter((m: Match) => m.match_season === currentSeason);
  const matchesPlayed = regularMatches.filter((m: Match) => m.match_date !== null).length;

  const activeMatch = regularMatches.find(
    (m: Match) => String(m.match_number) === activeTab,
  ) ?? null;

  return (
    <div>
      {/* Hero */}
      <div className="flex items-start justify-between flex-wrap gap-4 px-7 py-8 border-b border-[#1e2130]">
        <div>
          <div className="text-[11px] font-semibold text-[#ff4655] tracking-[.14em] uppercase mb-1.5">
            {currentSeason ? `Season ${currentSeason}` : 'Season —'}
          </div>
          <div className="font-display font-bold text-[32px] text-white leading-none tracking-[.02em]">
            Season Leaderboard
          </div>
          <div className="text-[13px] text-[#5a5f78] mt-2">
            Cumulative score across {regularMatches.length} matches · Top 10 qualify for the final
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="font-display font-bold text-[26px] text-white leading-none">{matchesPlayed}/9</div>
            <div className="text-[11px] text-[#5a5f78] mt-1 tracking-[.06em] uppercase">Matches played</div>
          </div>
          <div className="w-px bg-[#1e2130] self-stretch" />
          <div className="text-right">
            <div className="font-display font-bold text-[26px] text-white leading-none">{matchesPlayed * 3}</div>
            <div className="text-[11px] text-[#5a5f78] mt-1 tracking-[.06em] uppercase">Games total</div>
          </div>
        </div>
      </div>

      {/* Match tabs */}
      <div className="flex px-7 border-b border-[#1e2130] overflow-x-auto">
        <Link
          href={`/?currentSeason=${currentSeason}`}
          className={`text-[12px] font-medium px-[18px] py-3 border-b-2 whitespace-nowrap tracking-[.04em] ${
            activeTab === 'all' ? 'text-[#ff4655] border-[#ff4655]' : 'text-[#5a5f78] border-transparent hover:text-[#8b8fa8]'
          }`}
        >
          All matches
        </Link>
        {regularMatches.map((m: Match) => (
          <Link
            key={m.id}
            href={`/?currentSeason=${currentSeason}&tab=${m.match_number}&matchId=${m.id}&matchSeason=${m.match_season ?? currentSeason}`}
            className={`text-[12px] font-medium px-[18px] py-3 border-b-2 whitespace-nowrap tracking-[.04em] ${
              activeTab === String(m.match_number) ? 'text-[#ff4655] border-[#ff4655]' : 'text-[#5a5f78] border-transparent hover:text-[#8b8fa8]'
            }`}
          >
            Match {m.match_number}
          </Link>
        ))}
        <Link
          href={`/?currentSeason=${currentSeason}&tab=final`}
          className={`text-[12px] font-medium px-[18px] py-3 border-b-2 whitespace-nowrap tracking-[.04em] ${
            activeTab === 'final' ? 'text-[#f5a623] border-[#f5a623]' : 'text-[#f5a623]/50 border-transparent hover:text-[#f5a623]'
          }`}
        >
          Final ★
        </Link>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[1fr_300px] max-[768px]:grid-cols-1">

        {/* Table */}
        <div className="px-7 py-6 border-r border-[#1e2130]">
          <div className="font-display text-[13px] font-semibold tracking-[.1em] uppercase text-[#5a5f78] mb-3.5">
            {activeMatch ? `Match ${activeMatch.match_number}` : 'All matches'}
          </div>
          {error ? (
            <p className="text-[#ff4655] text-sm">{error}</p>
          ) : matches.length === 0 ? (
            <p className="text-[#5a5f78] text-sm">No matches yet.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={`${thClass} text-left`}>#</th>
                  <th className={`${thClass} text-left`}>Date</th>
                  <th className={`${thClass} text-left`}>Season</th>
                  <th className={`${thClass} text-right`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(activeMatch ? [activeMatch] : regularMatches).map((m: Match) => {
                  const done = m.match_date !== null;
                  return (
                    <tr key={m.id} className="border-b border-[#13151d] hover:bg-[#111420]">
                      <td className="py-2.5 px-2.5">
                        <Link
                          href={`/matches/${m.match_season ?? currentSeason}/${m.id}`}
                          className="font-display font-bold text-[15px] text-white hover:text-[#ff4655] transition-colors"
                        >
                          {m.match_number}
                        </Link>
                      </td>
                      <td className="py-2.5 px-2.5 text-[13px] text-[#c8ccdc]">{m.match_date ?? 'TBD'}</td>
                      <td className="py-2.5 px-2.5 text-[13px] text-[#8b8fa8]">
                        {m.match_season ? `Season ${m.match_season}` : '—'}
                      </td>
                      <td className="py-2.5 px-2.5 text-right">
                        <span className={`text-[10px] font-semibold tracking-[.08em] uppercase px-2 py-0.5 rounded-sm ${
                          done
                            ? 'text-[#4ade80] bg-[#4ade8012] border border-[#4ade8022]'
                            : 'text-[#5a5f78] bg-[#1e2130] border border-[#2a2f44]'
                        }`}>
                          {done ? 'Done' : 'Upcoming'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Sidebar */}
        <div className="px-5 py-6">
          <div className="font-display text-[13px] font-semibold tracking-[.1em] uppercase text-[#5a5f78] mb-3.5">
            Matches
          </div>

          {regularMatches.map((m: Match) => {
            const done = m.match_date !== null;
            return (
              <Link
                key={m.id}
                href={`/matches/${m.match_season ?? currentSeason}/${m.id}`}
                className={`block bg-[#111420] border rounded-lg px-4 py-3.5 mb-2.5 transition-colors ${
                  activeTab === String(m.match_number) ? 'border-[#ff465544]' : 'border-[#1e2130] hover:border-[#2a2f44]'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-display font-bold text-[14px] text-white tracking-[.04em]">
                    Match {m.match_number}
                  </span>
                  <span className={`text-[10px] font-semibold tracking-[.08em] uppercase px-2 py-0.5 rounded-sm ${
                    done
                      ? 'text-[#4ade80] bg-[#4ade8012] border border-[#4ade8022]'
                      : 'text-[#5a5f78] bg-[#1e2130] border border-[#2a2f44]'
                  }`}>
                    {done ? 'Done' : 'Upcoming'}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((g) => (
                    <div key={g} className={`flex-1 h-[3px] rounded-sm ${done ? 'bg-[#ff4655]' : 'bg-[#1e2130]'}`} />
                  ))}
                </div>
                <div className="text-[11px] text-[#3d4260] mt-2">{m.match_date ?? 'TBD'} · 3 games</div>
              </Link>
            );
          })}

          <div className="bg-[#14100d] border border-[#f5a62330] rounded-lg px-4 py-3.5 mt-3.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#f5a623] text-base">★</span>
              <span className="font-display font-bold text-[15px] text-[#f5a623] tracking-[.04em]">
                Match 9 · Final
              </span>
            </div>
            <div className="text-[11px] text-[#5a5f78] leading-relaxed">
              Top 10 from matches 1–8 qualify. Substitution system active for absent players.
            </div>
            <div className="mt-2.5 text-[11px] text-[#3d4260]">TBD</div>
          </div>
        </div>

      </div>
    </div>
  );
}
