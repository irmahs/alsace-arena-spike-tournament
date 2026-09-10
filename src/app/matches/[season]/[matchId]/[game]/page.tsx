import Link from 'next/link';
import { IconSword, IconShieldCheck, IconUsers, IconFlame, IconBomb, IconTrophy, IconChevronRight } from '@tabler/icons-react';
import { getGames } from '@/services/games';
import { getGameStatsBySeasonByMatchByGame } from '@/services/gameStats';
import { getMatchById } from '@/services/matches';
import { POINTS_PER_BONUS, POINTS_PER_WIN } from '@/constants/scoring';
import StatLeaders from '@/components/StatLeaders';
import type { GamePlayerStat } from '@/types';

const rankColors = ['text-[#f5a623]', 'text-[#b0b8cc]', 'text-[#b07840]'];

function BonusIcon({ active, icon: Icon, green = false }: { active: boolean; icon: React.ElementType; green?: boolean }) {
  return active
    ? <Icon size={14} className={`${green ? 'text-[#4ade80]' : 'text-[#f5a623]'} mx-auto`} />
    : <Icon size={14} className="text-[#1e2130] mx-auto" aria-hidden />;
}

const thClass =
  'text-[9px] font-semibold text-[#2a2f44] uppercase tracking-[.08em] pb-2 px-1.5 text-center border-b border-[#1e2130] whitespace-nowrap';

export default async function Page({
  params,
}: {
  params: Promise<{ season: string; matchId: string; game: string }>;
}) {
  const { season, matchId: matchIdStr, game: gameStr } = await params;
  const matchSeason = parseInt(season);
  const matchId = parseInt(matchIdStr);
  const activeGame = parseInt(gameStr);

  const [{ games }, { match }, { stats }] = await Promise.all([
    getGames(matchId),
    getMatchById(matchId),
    getGameStatsBySeasonByMatchByGame(matchId, activeGame),
  ]);

  const matchNumber = match?.match_number ?? matchId;
  const basePath = `/matches/${matchSeason}/${matchId}`;

  type ScoredPlayer = GamePlayerStat & { bonusCount: number; total: number };

  const displayPlayers: ScoredPlayer[] = stats
    .map((s): ScoredPlayer => {
      const bonusCount = [s.bonus_fb, s.bonus_death, s.bonus_assist, s.bonus_plant, s.bonus_defuse].filter(Boolean).length;
      const total = s.acs + s.kills + s.assists + s.econ_rating + s.first_bloods + s.plants + s.defuses + bonusCount * POINTS_PER_BONUS - s.deaths + (s.win ? POINTS_PER_WIN : 0);
      return {
        player_id: s.player_id,
        username: s.username,
        in_game_name: '',
        acs: s.acs,
        kills: s.kills,
        deaths: s.deaths,
        assists: s.assists,
        econ_rating: s.econ_rating,
        first_bloods: s.first_bloods,
        plants: s.plants,
        defuses: s.defuses,
        win: s.win,
        bonus_death: s.bonus_death,
        bonus_assist: s.bonus_assist,
        bonus_fb: s.bonus_fb,
        bonus_plant: s.bonus_plant,
        bonus_defuse: s.bonus_defuse,
        bonusCount,
        total,
      };
    })
    .sort((a, b) => b.total - a.total);

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
        <Link href={basePath} className="hover:text-[#c8ccdc] transition-colors">
          Match {matchNumber}
        </Link>
        <IconChevronRight size={11} />
        <span className="text-[#c8ccdc]">Game {activeGame}</span>
      </div>

      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[#1e2130]">
        <div className="text-[10px] font-semibold text-[#ff4655] tracking-[.14em] uppercase mb-1">
          Match {matchNumber} · Game {activeGame}
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
                ['Result', mvp.win ? 'Win' : 'Loss', false],
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
          className="text-[12px] font-medium px-4 py-3 border-b-2 whitespace-nowrap tracking-[.03em] text-[#5a5f78] border-transparent hover:text-[#8b8fa8]"
        >
          All games (total)
        </Link>
        {games.map((g) => (
          <Link
            key={g.id}
            href={`${basePath}/${g.game_number}`}
            className={`text-[12px] font-medium px-4 py-3 border-b-2 whitespace-nowrap tracking-[.03em] ${activeGame === g.game_number ? 'text-[#ff4655] border-[#ff4655]' : 'text-[#5a5f78] border-transparent hover:text-[#8b8fa8]'}`}
          >
            Game {g.game_number}
          </Link>
        ))}
      </div>

      <div className="px-6 pt-4 pb-8">
        <div className="font-display text-[11px] font-semibold tracking-[.1em] uppercase text-[#3d4260] mb-2.5">
          Game {activeGame} · Player stats
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
                  <tr key={player.player_id} className="border-b border-[#111120] hover:bg-[#111420]">
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
                    <td className="py-2 px-1.5 text-center border-l border-[#1e2130]">
                      <BonusIcon active={player.bonus_fb} icon={IconSword} />
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <BonusIcon active={player.bonus_death} icon={IconShieldCheck} />
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <BonusIcon active={player.bonus_assist} icon={IconUsers} />
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <BonusIcon active={player.bonus_plant} icon={IconFlame} />
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <BonusIcon active={player.bonus_defuse} icon={IconBomb} />
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <BonusIcon active={player.win} icon={IconTrophy} green />
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
