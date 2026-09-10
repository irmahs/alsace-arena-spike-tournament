import Link from 'next/link';
import { IconSword, IconShieldCheck, IconUsers, IconFlame, IconBomb, IconTrophy, IconChevronRight } from '@tabler/icons-react';
import { getGames } from '@/services/games';
import { getMatchById } from '@/services/matches';
import { getPlayerTotals } from '@/services/matchScores';
import StatLeaders from '@/components/StatLeaders';

const rankColors = ['text-[#f5a623]', 'text-[#b0b8cc]', 'text-[#b07840]'];

const thClass =
  'text-[9px] font-semibold text-[#2a2f44] uppercase tracking-[.08em] pb-2 px-1.5 text-center border-b border-[#1e2130] whitespace-nowrap';

export default async function Page({
  params,
}: {
  params: Promise<{ season: string; matchId: string }>;
}) {
  const { season, matchId: matchIdStr } = await params;
  const matchSeason = parseInt(season);
  const matchId = parseInt(matchIdStr);

  const [{ games }, { match }, { totals: displayPlayers }] = await Promise.all([
    getGames(matchId),
    getMatchById(matchId),
    getPlayerTotals([matchId]),
  ]);

  const matchNumber = match?.match_number ?? matchId;
  const basePath = `/matches/${matchSeason}/${matchId}`;

  const mvp = displayPlayers[0] ?? null;
  const leaderName = (
    key: 'kills' | 'assists' | 'deaths' | 'first_bloods' | 'plants' | 'defuses',
    dir: 'max' | 'min',
  ) => {
    if (displayPlayers.length === 0) return '—';
    return displayPlayers.reduce((best, p) =>
      dir === 'max' ? (p[key] > best[key] ? p : best) : p[key] < best[key] ? p : best,
    ).username;
  };
  const categories = [
    { label: 'Least deaths', name: leaderName('deaths', 'min') },
    { label: 'Most kills', name: leaderName('kills', 'max') },
    { label: 'Most assists', name: leaderName('assists', 'max') },
    { label: 'Most first bloods', name: leaderName('first_bloods', 'max') },
    { label: 'Most plants', name: leaderName('plants', 'max') },
    { label: 'Most defuses', name: leaderName('defuses', 'max') },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#1e2130] text-[12px] text-[#3d4260]">
        <Link href="/" className="hover:text-[#c8ccdc] transition-colors">Leaderboard</Link>
        <IconChevronRight size={11} />
        <span className="text-[#c8ccdc]">Match {matchNumber}</span>
      </div>

      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[#1e2130]">
        <div className="text-[10px] font-semibold text-[#ff4655] tracking-[.14em] uppercase mb-1">
          Match {matchNumber}
        </div>
        <div className="font-display font-bold text-[24px] text-white tracking-[.02em]">
          Match {matchNumber}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#3d4260] mt-1">
          {games.length > 0 && <span>{games.length} game{games.length === 1 ? '' : 's'} played</span>}
        </div>
      </div>

      {/* Most Valuable Player */}
      <div className="px-6 py-5 border-b border-[#1e2130]">
        {mvp ? (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#f5a62330] bg-[#14100d] px-5 py-4">
            <IconTrophy size={28} className="shrink-0 text-[#f5a623]" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#f5a623]">
                Most Valuable Player
              </div>
              <div className="mt-1 font-display text-[22px] font-bold leading-none text-white">{mvp.username}</div>
            </div>
            <div className="ml-auto flex gap-5">
              {([
                ['Points', mvp.total, true],
                ['K / D / A', `${mvp.kills} / ${mvp.deaths} / ${mvp.assists}`, false],
                ['ACS', mvp.acs, false],
                ['Wins', mvp.wins, false],
              ] as const).map(([lbl, val, gold]) => (
                <div key={lbl} className="text-right">
                  <div className={`font-display text-[18px] font-bold leading-none ${gold ? 'text-[#f5a623]' : 'text-white'}`}>
                    {val}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[.06em] text-[#5a5f78]">{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[#5a5f78] text-sm">No stats recorded yet.</p>
        )}
      </div>

      {/* Category leaders */}
      {mvp && <StatLeaders items={categories} />}

      {/* Game tabs */}
      <div className="flex px-6 border-b border-[#1e2130] overflow-x-auto">
        <Link
          href={basePath}
          className="text-[12px] font-medium px-4 py-3 border-b-2 whitespace-nowrap tracking-[.03em] text-[#ff4655] border-[#ff4655]"
        >
          All games (total)
        </Link>
        {games.map((g) => (
          <Link
            key={g.id}
            href={`${basePath}/${g.game_number}`}
            className="text-[12px] font-medium px-4 py-3 border-b-2 whitespace-nowrap tracking-[.03em] text-[#5a5f78] border-transparent hover:text-[#8b8fa8]"
          >
            Game {g.game_number}
          </Link>
        ))}
      </div>

      <div className="px-6 pt-4 pb-8">
        <div className="font-display text-[11px] font-semibold tracking-[.1em] uppercase text-[#3d4260] mb-2.5">
          Cumulative stats across all games
        </div>

        {displayPlayers.length === 0 ? (
          <p className="text-[#5a5f78] text-sm">No stats recorded yet.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mb-3.5 px-3.5 py-2.5 bg-[#111420] border border-[#1e2130] rounded-lg">
              {[
                { Icon: IconSword, label: 'First blood bonus', green: false },
                { Icon: IconShieldCheck, label: 'Least deaths bonus', green: false },
                { Icon: IconUsers, label: 'Most assists bonus', green: false },
                { Icon: IconFlame, label: 'Most plants bonus', green: false },
                { Icon: IconBomb, label: 'Most defuses bonus', green: false },
                { Icon: IconTrophy, label: 'Victory', green: true },
              ].map(({ Icon, label, green }) => (
                <div key={label} className="flex items-center gap-1.5 text-[11px] text-[#5a5f78]">
                  <Icon size={14} className={green ? 'text-[#4ade80]' : 'text-[#f5a623]'} />
                  {label}
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
            <table className="border-collapse min-w-[820px] w-full">
              <thead>
                <tr>
                  <th className={`${thClass} text-left`} colSpan={2}></th>
                  <th className={`${thClass} border-b border-[#1e2130]`} colSpan={8}>Statistiques</th>
                  <th className={`${thClass} border-l border-[#1e2130]`} colSpan={6}>Bonuses</th>
                  <th className={`${thClass} border-l border-[#1e2130]`}>Total</th>
                </tr>
                <tr className="[&>th]:pt-2">
                  <th className={`${thClass} text-left w-6`}>#</th>
                  <th className={`${thClass} text-left w-36 pl-0`}>Player</th>
                  {['ACS', 'K', 'D', 'A', 'Eco', 'FB', 'Pl.', 'Def.'].map((h) => (
                    <th key={h} className={`${thClass} w-9`}>{h}</th>
                  ))}
                  <th className={`${thClass} w-8 border-l border-[#1e2130]`}><IconSword size={12} className="mx-auto" /></th>
                  <th className={`${thClass} w-8`}><IconShieldCheck size={12} className="mx-auto" /></th>
                  <th className={`${thClass} w-8`}><IconUsers size={12} className="mx-auto" /></th>
                  <th className={`${thClass} w-8`}><IconFlame size={12} className="mx-auto" /></th>
                  <th className={`${thClass} w-8`}><IconBomb size={12} className="mx-auto" /></th>
                  <th className={`${thClass} w-8`}><IconTrophy size={12} className="mx-auto" /></th>
                  <th className={`${thClass} w-12 border-l border-[#1e2130]`}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {displayPlayers.map((player, i) => (
                  <tr key={player.player_id} className="border-b border-[#111420] hover:bg-[#111420]">
                    <td className="py-2 px-1.5 text-left">
                      <span className={`font-display font-bold text-[13px] w-5 inline-block text-center ${rankColors[i] ?? 'text-[#2a2f44]'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-2 pl-0 pr-1.5 text-left">
                      <span className="font-medium text-[12px] text-[#c8ccdc]">{player.username}</span>
                    </td>
                    <td className="py-2 px-1.5 text-center text-[12px] font-semibold font-display text-[#e2e4ea]">{player.acs}</td>
                    <td className="py-2 px-1.5 text-center text-[12px] font-semibold font-display text-[#e2e4ea]">{player.kills}</td>
                    <td className="py-2 px-1.5 text-center text-[12px] text-[#3d4260]">{player.deaths}</td>
                    <td className="py-2 px-1.5 text-center text-[12px] font-semibold font-display text-[#e2e4ea]">{player.assists}</td>
                    <td className="py-2 px-1.5 text-center text-[12px] text-[#8b8fa8]">{player.econ_rating}</td>
                    <td className="py-2 px-1.5 text-center text-[12px] font-semibold font-display text-[#e2e4ea]">{player.first_bloods}</td>
                    <td className="py-2 px-1.5 text-center text-[12px] text-[#8b8fa8]">{player.plants}</td>
                    <td className="py-2 px-1.5 text-center text-[12px] text-[#8b8fa8]">{player.defuses}</td>
                    {([
                      player.bonus_fb,
                      player.bonus_death,
                      player.bonus_assist,
                      player.bonus_plant,
                      player.bonus_defuse,
                    ] as number[]).map((count, idx) => (
                      <td key={idx} className={`py-2 px-1.5 text-center text-[12px] font-semibold font-display ${idx === 0 ? 'border-l border-[#1e2130]' : ''} ${count > 0 ? 'text-[#f5a623]' : 'text-[#1e2130]'}`}>
                        {count > 0 ? count : '—'}
                      </td>
                    ))}
                    <td className={`py-2 px-1.5 text-center text-[12px] font-semibold font-display ${player.wins > 0 ? 'text-[#4ade80]' : 'text-[#1e2130]'}`}>
                      {player.wins > 0 ? player.wins : '—'}
                    </td>
                    <td className="py-2 px-1.5 text-center border-l border-[#1e2130] text-[12px] font-bold font-display text-white">
                      {player.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
