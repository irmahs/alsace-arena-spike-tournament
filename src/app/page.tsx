import { redirect } from 'next/navigation';
import Link from 'next/link';
import { IconSword, IconShieldCheck, IconUsers, IconFlame, IconBomb, IconTrophy } from '@tabler/icons-react';
import { getMatches } from '@/services/matches';
import { getGameCounts } from '@/services/games';
import { getPlayerTotals } from '@/services/matchScores';
import type { Match } from '@/types';

const statThClass =
  'text-[9px] font-semibold text-[#2a2f44] uppercase tracking-[.08em] pb-2 px-1.5 text-center border-b border-[#1e2130] whitespace-nowrap';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; currentSeason?: string }>;
}) {
  const { tab, currentSeason: currentSeasonParam } = await searchParams;
  const activeTab = tab ?? 'all';

  const { matches } = await getMatches();
  const maxSeason = matches.reduce((max: number, m: Match) => Math.max(max, m.match_season ?? 0), 0) || null;

  if (!currentSeasonParam && maxSeason) {
    const params = new URLSearchParams({ currentSeason: String(maxSeason) });
    if (tab) params.set('tab', tab);
    redirect(`/?${params.toString()}`);
  }

  const currentSeason = currentSeasonParam ? parseInt(currentSeasonParam) : maxSeason;
  const seasonMatches = matches.filter((m: Match) => m.match_season === currentSeason);

  const { byMatch: gamesByMatch, total: gamesTotal } = await getGameCounts(
    seasonMatches.map((m: Match) => m.id),
  );
  // Only matches that actually have games recorded.
  const playedMatches = seasonMatches.filter((m: Match) => (gamesByMatch.get(m.id) ?? 0) > 0);

  const activeMatch = playedMatches.find((m: Match) => String(m.match_number) === activeTab) ?? null;

  const [{ totals: seasonTotals }, perMatch] = await Promise.all([
    getPlayerTotals(playedMatches.map((m: Match) => m.id)),
    activeMatch ? getPlayerTotals([activeMatch.id]) : Promise.resolve(null),
  ]);
  const mvp = seasonTotals[0] ?? null;
  const runnersUp = seasonTotals.slice(1, 3); // silver, bronze
  const matchTotals = perMatch ? perMatch.totals : seasonTotals;
  const totalsError = perMatch ? perMatch.error : null;

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
            Cumulative stats across all games
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="font-display font-bold text-[26px] text-white leading-none">
              {playedMatches.length || '—'}
            </div>
            <div className="text-[11px] text-[#5a5f78] mt-1 tracking-[.06em] uppercase">Matches played</div>
          </div>
          <div className="w-px bg-[#1e2130] self-stretch" />
          <div className="text-right">
            <div className="font-display font-bold text-[26px] text-white leading-none">{gamesTotal || '—'}</div>
            <div className="text-[11px] text-[#5a5f78] mt-1 tracking-[.06em] uppercase">Games total</div>
          </div>
        </div>
      </div>

      {/* Podium */}
      {mvp && (
        <div className="flex flex-wrap gap-3 px-7 py-5 border-b border-[#1e2130]">
          {/* MVP */}
          <div className="flex flex-1 min-w-[280px] flex-wrap items-center gap-4 rounded-xl border border-[#f5a62330] bg-[#14100d] px-5 py-4">
            <IconTrophy size={28} className="shrink-0 text-[#f5a623]" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#f5a623]">
                {currentSeason ? `Season ${currentSeason} MVP` : 'MVP'}
              </div>
              <div className="mt-1 font-display text-[22px] font-bold leading-none text-white">{mvp.username}</div>
              <div className="mt-1 text-[11px] text-[#5a5f78]">#1 across all games this season</div>
            </div>
            <div className="ml-auto flex gap-5">
              {([
                ['Points', mvp.total, true],
                ['Kills', mvp.kills, false],
                ['ACS', mvp.acs, false],
                ['Wins', mvp.wins, false],
              ] as const).map(([lbl, val, gold]) => (
                <div key={lbl} className="text-right">
                  <div
                    className={`font-display text-[20px] font-bold leading-none ${gold ? 'text-[#f5a623]' : 'text-white'}`}
                  >
                    {val}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[.06em] text-[#5a5f78]">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Silver / bronze */}
          {runnersUp.map((p, i) => {
            const meta = i === 0
              ? { label: '2nd', text: 'text-[#b0b8cc]', border: 'border-[#b0b8cc26]', bg: 'bg-[#101318]' }
              : { label: '3rd', text: 'text-[#b07840]', border: 'border-[#b0784026]', bg: 'bg-[#130f0c]' };
            return (
              <div
                key={p.player_id}
                className={`flex w-[170px] flex-col justify-center rounded-xl border px-4 py-4 ${meta.border} ${meta.bg}`}
              >
                <div className={`text-[10px] font-semibold uppercase tracking-[.14em] ${meta.text}`}>{meta.label}</div>
                <div className="mt-1 font-display text-[16px] font-bold leading-tight text-white">{p.username}</div>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="font-display text-[18px] font-bold text-[#f5a623]">{p.total}</span>
                  <span className="text-[10px] uppercase tracking-[.06em] text-[#5a5f78]">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
        {playedMatches.map((m: Match) => (
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
      </div>

      {/* Leaderboard table */}
      <div className="px-7 py-6">
          <div className="flex items-center gap-3 mb-3.5">
            <div className="font-display text-[13px] font-semibold tracking-[.1em] uppercase text-[#5a5f78]">
              {activeMatch ? `Match ${activeMatch.match_number}` : 'Global leaderboard'}
            </div>
            {activeMatch && (
              <Link
                href={`/matches/${activeMatch.match_season ?? currentSeason}/${activeMatch.id}`}
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
              <div className="text-[11px] text-[#3d4260] mb-2.5">Cumulative stats across all games</div>
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
    </div>
  );
}
