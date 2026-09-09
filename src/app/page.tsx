import { redirect } from 'next/navigation';
import Link from 'next/link';
import { IconSword, IconShieldCheck, IconUsers, IconFlame, IconBomb, IconTrophy } from '@tabler/icons-react';
import { getMatches } from '@/services/matches';
import { getPlayerTotals } from '@/services/matchScores';
import type { Match } from '@/types';

const statThClass = 'text-[9px] font-semibold text-[#2a2f44] uppercase tracking-[.08em] pb-2 px-1.5 text-center border-b border-[#1e2130] whitespace-nowrap';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; currentSeason?: string }>;
}) {
  const { tab, currentSeason: currentSeasonParam } = await searchParams;
  const activeTab = tab ?? 'all';

  const { matches } = await getMatches();

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

  const isFinalTab = activeTab === 'final';
  const finalMatch = matches.find((m: Match) => m.is_final && m.match_season === currentSeason) ?? null;

  // "All matches" tab -> season-wide leaderboard; a match / final tab -> that match only.
  const leaderboardMatch = activeMatch ?? (isFinalTab ? finalMatch : null);
  const leaderboardMatchIds =
    activeTab === 'all'
      ? regularMatches.map((m: Match) => m.id)
      : leaderboardMatch
        ? [leaderboardMatch.id]
        : [];
  const { totals: matchTotals, error: totalsError } = await getPlayerTotals(leaderboardMatchIds);

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
          <div className="flex items-center gap-3 mb-3.5">
            <div className="font-display text-[13px] font-semibold tracking-[.1em] uppercase text-[#5a5f78]">
              {activeMatch ? `Match ${activeMatch.match_number}` : isFinalTab ? 'Final' : 'Global leaderboard'}
            </div>
            {leaderboardMatch && (
              <Link
                href={`/matches/${leaderboardMatch.match_season ?? currentSeason}/${leaderboardMatch.id}`}
                className="text-[11px] font-medium text-[#ff4655] hover:text-white tracking-[.04em] transition-colors"
              >
                Match detail →
              </Link>
            )}
          </div>
          {totalsError ? (
            <p className="text-[#ff4655] text-sm">{totalsError}</p>
          ) : (
              <div className="overflow-x-auto">
                <div className="text-[11px] text-[#3d4260] mb-2.5">
                  {activeTab === 'all'
                    ? `Cumulative stats across all ${regularMatches.length} matches`
                    : 'Cumulative stats across all 3 games'}
                </div>
                <table className="border-collapse min-w-[720px] w-full">
                  <thead>
                    <tr>
                      <th className={`${statThClass} text-left`} colSpan={2}></th>
                      <th className={`${statThClass}`} colSpan={8}>Statistiques</th>
                      <th className={`${statThClass} border-l border-[#1e2130]`} colSpan={6}>Bonuses</th>
                      <th className={`${statThClass} border-l border-[#1e2130]`}>Total</th>
                    </tr>
                    <tr className="[&>th]:pt-2">
                      <th className={`${statThClass} text-left w-6`}>#</th>
                      <th className={`${statThClass} text-left w-36 pl-0`}>Player</th>
                      {['ACS', 'K', 'D', 'A', 'Eco', 'FB', 'Pl.', 'Def.'].map((h) => (
                        <th key={h} className={`${statThClass} w-9`}>{h}</th>
                      ))}
                      <th className={`${statThClass} w-8 border-l border-[#1e2130]`}><IconSword size={12} className="mx-auto" /></th>
                      <th className={`${statThClass} w-8`}><IconShieldCheck size={12} className="mx-auto" /></th>
                      <th className={`${statThClass} w-8`}><IconUsers size={12} className="mx-auto" /></th>
                      <th className={`${statThClass} w-8`}><IconFlame size={12} className="mx-auto" /></th>
                      <th className={`${statThClass} w-8`}><IconBomb size={12} className="mx-auto" /></th>
                      <th className={`${statThClass} w-8`}><IconTrophy size={12} className="mx-auto" /></th>
                      <th className={`${statThClass} w-12 border-l border-[#1e2130]`}>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchTotals.map((p, i) => (
                      <tr key={p.player_id} className="border-b border-[#111420] hover:bg-[#111420]">
                        <td className="py-2 px-1.5 text-left">
                          <span className={`font-display font-bold text-[13px] w-5 inline-block text-center ${['text-[#f5a623]', 'text-[#b0b8cc]', 'text-[#b07840]'][i] ?? 'text-[#2a2f44]'}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-2 pl-0 pr-1.5 text-left text-[12px] font-medium text-[#c8ccdc]">{p.username}</td>
                        <td className="py-2 px-1.5 text-center text-[12px] font-semibold font-display text-[#e2e4ea]">{p.acs}</td>
                        <td className="py-2 px-1.5 text-center text-[12px] font-semibold font-display text-[#e2e4ea]">{p.kills}</td>
                        <td className="py-2 px-1.5 text-center text-[12px] text-[#3d4260]">{p.deaths}</td>
                        <td className="py-2 px-1.5 text-center text-[12px] font-semibold font-display text-[#e2e4ea]">{p.assists}</td>
                        <td className="py-2 px-1.5 text-center text-[12px] text-[#8b8fa8]">{p.econ_rating}</td>
                        <td className="py-2 px-1.5 text-center text-[12px] font-semibold font-display text-[#e2e4ea]">{p.first_bloods}</td>
                        <td className="py-2 px-1.5 text-center text-[12px] text-[#8b8fa8]">{p.plants}</td>
                        <td className="py-2 px-1.5 text-center text-[12px] text-[#8b8fa8]">{p.defuses}</td>
                        {[p.bonus_fb, p.bonus_death, p.bonus_assist, p.bonus_plant, p.bonus_defuse].map((count, idx) => (
                          <td key={idx} className={`py-2 px-1.5 text-center text-[12px] font-semibold font-display ${idx === 0 ? 'border-l border-[#1e2130]' : ''} ${count > 0 ? 'text-[#f5a623]' : 'text-[#1e2130]'}`}>
                            {count > 0 ? count : '—'}
                          </td>
                        ))}
                        <td className={`py-2 px-1.5 text-center text-[12px] font-semibold font-display ${p.wins > 0 ? 'text-[#4ade80]' : 'text-[#1e2130]'}`}>
                          {p.wins > 0 ? p.wins : '—'}
                        </td>
                        <td className="py-2 px-1.5 text-center border-l border-[#1e2130] text-[12px] font-bold font-display text-white">
                          {p.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
