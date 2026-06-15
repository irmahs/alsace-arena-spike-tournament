import Link from 'next/link';
import { IconSword, IconShieldCheck, IconUsers, IconFlame, IconBomb, IconTrophy, IconChevronRight } from '@tabler/icons-react';
import { getGames } from '@/services/games';
import { getGameStatsBySeasonByMatchByGame } from '@/services/gameStats';
import { getMatchById } from '@/services/matches';
import { POINTS_PER_BONUS, POINTS_PER_WIN } from '@/constants/scoring';

const rankColors = ['text-[#f5a623]', 'text-[#b0b8cc]', 'text-[#b07840]'];

const thClass =
  'text-[9px] font-semibold text-[#2a2f44] uppercase tracking-[.08em] pb-2 px-1.5 text-center border-b border-[#1e2130] whitespace-nowrap';

type AggStat = {
  player_id: string;
  username: string;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  econ_rating: number;
  first_bloods: number;
  plants: number;
  defuses: number;
  wins: number;
  bonus_fb: number;
  bonus_death: number;
  bonus_assist: number;
  bonus_plant: number;
  bonus_defuse: number;
  bonusCount: number;
  total: number;
};

export default async function Page({
  params,
}: {
  params: Promise<{ season: string; matchId: string }>;
}) {
  const { season, matchId: matchIdStr } = await params;
  const matchSeason = parseInt(season);
  const matchId = parseInt(matchIdStr);

  const [{ games }, { match }, g1, g2, g3] = await Promise.all([
    getGames(matchId),
    getMatchById(matchId),
    getGameStatsBySeasonByMatchByGame(matchId, 1),
    getGameStatsBySeasonByMatchByGame(matchId, 2),
    getGameStatsBySeasonByMatchByGame(matchId, 3),
  ]);

  const matchNumber = match?.match_number ?? matchId;
  const basePath = `/matches/${matchSeason}/${matchId}`;

  const allStats = [...g1.stats, ...g2.stats, ...g3.stats];

  const aggMap = new Map<string, Omit<AggStat, 'bonusCount' | 'total'>>();
  for (const s of allStats) {
    const e = aggMap.get(s.player_id);
    if (e) {
      e.acs += s.acs;
      e.kills += s.kills;
      e.deaths += s.deaths;
      e.assists += s.assists;
      e.econ_rating += s.econ_rating;
      e.first_bloods += s.first_bloods;
      e.plants += s.plants;
      e.defuses += s.defuses;
      e.wins += s.win ? 1 : 0;
      e.bonus_fb += s.bonus_fb ? 1 : 0;
      e.bonus_death += s.bonus_death ? 1 : 0;
      e.bonus_assist += s.bonus_assist ? 1 : 0;
      e.bonus_plant += s.bonus_plant ? 1 : 0;
      e.bonus_defuse += s.bonus_defuse ? 1 : 0;
    } else {
      aggMap.set(s.player_id, {
        player_id: s.player_id,
        username: s.username,
        acs: s.acs,
        kills: s.kills,
        deaths: s.deaths,
        assists: s.assists,
        econ_rating: s.econ_rating,
        first_bloods: s.first_bloods,
        plants: s.plants,
        defuses: s.defuses,
        wins: s.win ? 1 : 0,
        bonus_fb: s.bonus_fb ? 1 : 0,
        bonus_death: s.bonus_death ? 1 : 0,
        bonus_assist: s.bonus_assist ? 1 : 0,
        bonus_plant: s.bonus_plant ? 1 : 0,
        bonus_defuse: s.bonus_defuse ? 1 : 0,
      });
    }
  }

  const displayPlayers: AggStat[] = [...aggMap.values()]
    .map((p) => {
      const bonusCount = p.bonus_fb + p.bonus_death + p.bonus_assist + p.bonus_plant + p.bonus_defuse;
      const total = p.acs + p.kills + p.assists + p.econ_rating + p.first_bloods + p.plants + p.defuses + bonusCount * POINTS_PER_BONUS - p.deaths + p.wins * POINTS_PER_WIN;
      return { ...p, bonusCount, total };
    })
    .sort((a, b) => b.total - a.total);

  const mostKills = displayPlayers.length > 0 ? Math.max(...displayPlayers.map((p) => p.kills)) : '—';
  const leastDeaths = displayPlayers.length > 0 ? Math.min(...displayPlayers.map((p) => p.deaths)) : '—';
  const bestScorer = displayPlayers[0]?.username ?? '—';
  const mostAssists = displayPlayers.length > 0 ? Math.max(...displayPlayers.map((p) => p.assists)) : '—';
  const topAcs = displayPlayers[0]?.acs ?? '—';

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
          {games.length > 0 && <><span>·</span><span>{games.length} games played</span></>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex gap-2.5 px-6 py-4 border-b border-[#1e2130]">
        {[
          { val: mostKills, lbl: 'Most kills' },
          { val: leastDeaths, lbl: 'Least deaths' },
          { val: bestScorer, lbl: 'MVP', gold: true },
          { val: mostAssists, lbl: 'Most assists' },
          { val: topAcs, lbl: 'Top ACS' },
        ].map(({ val, lbl, gold }) => (
          <div key={lbl} className="flex-1 bg-[#111420] rounded-lg px-3.5 py-2.5">
            <div className={`font-display text-[22px] font-bold leading-none ${gold ? 'text-[#f5a623]' : 'text-white'}`}>
              {val}
            </div>
            <div className="text-[10px] text-[#3d4260] tracking-[.07em] uppercase mt-1">{lbl}</div>
          </div>
        ))}
      </div>

      {/* Game tabs */}
      <div className="flex px-6 border-b border-[#1e2130]">
        <Link
          href={basePath}
          className="text-[12px] font-medium px-4 py-3 border-b-2 whitespace-nowrap tracking-[.03em] text-[#ff4655] border-[#ff4655]"
        >
          All games (total)
        </Link>
        {[1, 2, 3].map((n) => (
          <Link
            key={n}
            href={`${basePath}/${n}`}
            className="text-[12px] font-medium px-4 py-3 border-b-2 whitespace-nowrap tracking-[.03em] text-[#5a5f78] border-transparent hover:text-[#8b8fa8]"
          >
            Game {n}
          </Link>
        ))}
      </div>

      <div className="px-6 pt-4 pb-8">
        <div className="font-display text-[11px] font-semibold tracking-[.1em] uppercase text-[#3d4260] mb-2.5">
          All games · Combined stats
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
