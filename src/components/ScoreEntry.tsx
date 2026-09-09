'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { computeScore } from '@/constants/scoring';
import { saveGameStats, type SaveRow } from '@/app/admin/actions';
import type { Match } from '@/types';
import type { PlayerRef } from '@/services/players';

type ScannedPlayer = {
  name: string;
  combat_score: number;
  kills: number;
  deaths: number;
  assists: number;
  econ: number;
  first_bloods: number;
  plants: number;
  defuses: number;
};

type Row = {
  key: string;
  name: string;
  player_id: string;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  econ_rating: number;
  first_bloods: number;
  plants: number;
  defuses: number;
  win: boolean;
  bonus_fb: boolean;
  bonus_death: boolean;
  bonus_assist: boolean;
  bonus_plant: boolean;
  bonus_defuse: boolean;
};

const NUM_FIELDS = [
  ['acs', 'ACS'],
  ['kills', 'K'],
  ['deaths', 'D'],
  ['assists', 'A'],
  ['econ_rating', 'Eco'],
  ['first_bloods', 'FB'],
  ['plants', 'Pl.'],
  ['defuses', 'Def.'],
] as const;

const BONUS_FIELDS = [
  ['bonus_fb', 'First blood'],
  ['bonus_death', 'Least deaths'],
  ['bonus_assist', 'Most assists'],
  ['bonus_plant', 'Most plants'],
  ['bonus_defuse', 'Most defuses'],
] as const;

const label = 'text-[11px] font-semibold uppercase tracking-[.06em] text-[#5a5f78]';
const select =
  'rounded-md border border-[#1e2130] bg-[#111420] px-2.5 py-2 text-[13px] text-[#e2e4ea] [color-scheme:dark] focus:border-[#ff465555] focus:outline-none disabled:opacity-40';
const cellInput =
  'w-12 rounded-md border border-[#1e2130] bg-[#111420] px-1 py-1.5 text-center text-[12px] text-[#e2e4ea] [color-scheme:dark] focus:outline-none';
const th =
  'px-1.5 pb-2 text-[9px] font-semibold uppercase tracking-[.08em] text-[#2a2f44] border-b border-[#1e2130] whitespace-nowrap';

function matchPlayer(name: string, players: PlayerRef[]): PlayerRef | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  return (
    players.find((p) => p.username.toLowerCase() === n || p.in_game_name.toLowerCase() === n) ?? null
  );
}

function emptyRow(): Row {
  return {
    key: crypto.randomUUID(),
    name: '',
    player_id: '',
    acs: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    econ_rating: 0,
    first_bloods: 0,
    plants: 0,
    defuses: 0,
    win: false,
    bonus_fb: false,
    bonus_death: false,
    bonus_assist: false,
    bonus_plant: false,
    bonus_defuse: false,
  };
}

/** Pre-tick least-deaths / most-assists / most-plants / most-defuses. First blood stays manual. */
function withAutoBonuses(rows: Row[]): Row[] {
  if (rows.length === 0) return rows;
  const minDeaths = Math.min(...rows.map((r) => r.deaths));
  const maxAssists = Math.max(...rows.map((r) => r.assists));
  const maxPlants = Math.max(...rows.map((r) => r.plants));
  const maxDefuses = Math.max(...rows.map((r) => r.defuses));
  return rows.map((r) => ({
    ...r,
    bonus_death: r.deaths === minDeaths,
    bonus_assist: maxAssists > 0 && r.assists === maxAssists,
    bonus_plant: maxPlants > 0 && r.plants === maxPlants,
    bonus_defuse: maxDefuses > 0 && r.defuses === maxDefuses,
  }));
}

function rowPoints(r: Row): number {
  return computeScore({
    acs: r.acs,
    kills: r.kills,
    deaths: r.deaths,
    assists: r.assists,
    econ_rating: r.econ_rating,
    first_bloods: r.first_bloods,
    plants: r.plants,
    defuses: r.defuses,
    bonus_count: BONUS_FIELDS.filter(([k]) => r[k]).length,
    wins: r.win ? 1 : 0,
  });
}

export default function ScoreEntry({
  matches,
  players,
}: {
  matches: Match[];
  players: PlayerRef[];
}) {
  const maxSeason = useMemo(
    () => matches.reduce((max, m) => Math.max(max, m.match_season ?? 0), 0) || 1,
    [matches],
  );
  const seasonOptions = useMemo(
    () => Array.from({ length: Math.max(maxSeason + 2, 12) }, (_, i) => i + 1),
    [maxSeason],
  );

  const [season, setSeason] = useState<number | ''>(maxSeason);
  const [matchNumber, setMatchNumber] = useState<number | ''>('');
  const [gameNumber, setGameNumber] = useState<number | ''>('');

  const [rows, setRows] = useState<Row[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const unmatched = rows.filter((r) => !r.player_id).length;
  const ready = season !== '' && matchNumber !== '' && gameNumber !== '' && rows.length > 0;

  function patch(key: string, next: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...next } : r)));
    setSaveMsg(null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setScanning(true);
    setScanError(null);
    setSaveMsg(null);
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await fetch('/api/admin/scan-scoreboard', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Scan failed.');

      const scanned: ScannedPlayer[] = json.players ?? [];
      const built: Row[] = scanned.map((p) => {
        const hit = matchPlayer(p.name, players);
        return {
          ...emptyRow(),
          name: p.name,
          player_id: hit?.id ?? '',
          acs: p.combat_score ?? 0,
          kills: p.kills ?? 0,
          deaths: p.deaths ?? 0,
          assists: p.assists ?? 0,
          econ_rating: p.econ ?? 0,
          first_bloods: p.first_bloods ?? 0,
          plants: p.plants ?? 0,
          defuses: p.defuses ?? 0,
        };
      });
      setRows(withAutoBonuses(built));
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed.');
    } finally {
      setScanning(false);
    }
  }

  function save() {
    setSaveMsg(null);
    const payload: SaveRow[] = rows.map((r) => ({
      player_id: r.player_id,
      acs: r.acs,
      kills: r.kills,
      deaths: r.deaths,
      assists: r.assists,
      econ_rating: r.econ_rating,
      first_bloods: r.first_bloods,
      plants: r.plants,
      defuses: r.defuses,
      win: r.win,
      bonus_fb: r.bonus_fb,
      bonus_death: r.bonus_death,
      bonus_assist: r.bonus_assist,
      bonus_plant: r.bonus_plant,
      bonus_defuse: r.bonus_defuse,
    }));
    startSaving(async () => {
      const result = await saveGameStats({
        season: Number(season),
        matchNumber: Number(matchNumber),
        gameNumber: Number(gameNumber),
        rows: payload,
      });
      setSaveMsg(
        result.ok
          ? {
              ok: true,
              text: `Saved ${payload.length} players to season ${season}, match ${matchNumber}, game ${gameNumber}.`,
            }
          : { ok: false, text: result.error ?? 'Save failed.' },
      );
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* Selectors */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <span className={label}>Season</span>
          <select
            className={select}
            value={season}
            onChange={(e) => setSeason(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">–</option>
            {seasonOptions.map((s) => (
              <option key={s} value={s}>
                Season {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={label}>Match</span>
          <select
            className={select}
            value={matchNumber}
            onChange={(e) => setMatchNumber(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">–</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={n}>
                {n === 9 ? 'Match 9 · Final' : `Match ${n}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={label}>Game</span>
          <select
            className={select}
            value={gameNumber}
            onChange={(e) => setGameNumber(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">–</option>
            {[1, 2, 3].map((g) => (
              <option key={g} value={g}>
                Game {g}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={label}>Score picture</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={gameNumber === '' || scanning}
              className="rounded-md bg-[#ff4655] px-3.5 py-2 text-[13px] font-semibold uppercase tracking-[.04em] text-white transition-colors hover:bg-[#ff5b68] disabled:opacity-40"
            >
              {scanning ? 'Scanning…' : 'Upload & scan'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRows((rs) => [...rs, emptyRow()]);
                setSaveMsg(null);
              }}
              disabled={gameNumber === ''}
              className="rounded-md border border-[#1e2130] px-3 py-2 text-[13px] font-medium text-[#8b8fa8] transition-colors hover:border-[#2a2f44] hover:text-white disabled:opacity-40"
            >
              + Row
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={onFile} />
        </div>
      </div>

      {scanError && (
        <p className="rounded-md border border-[#ff465533] bg-[#ff46550f] px-3 py-2 text-[12px] text-[#ff4655]">
          {scanError}
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#5a5f78]">
            <span>{rows.length} rows</span>
            {unmatched > 0 && (
              <span className="text-[#ff4655]">⚠ {unmatched} unmatched player{unmatched > 1 ? 's' : ''}</span>
            )}
            <span>Bonuses were auto-filled from the numbers — adjust before saving.</span>
            <span>No win ticked = no victory bonus.</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] border-collapse">
              <thead>
                <tr>
                  <th className={`${th} text-left`}>Player (scanned)</th>
                  <th className={`${th} text-left`}>Linked player</th>
                  {NUM_FIELDS.map(([, h]) => (
                    <th key={h} className={`${th} w-14`}>
                      {h}
                    </th>
                  ))}
                  <th className={`${th} w-12 border-l border-[#1e2130]`}>Win</th>
                  {BONUS_FIELDS.map(([, h]) => (
                    <th key={h} className={`${th} w-14`}>
                      {h}
                    </th>
                  ))}
                  <th className={`${th} w-14 border-l border-[#1e2130]`}>Pts</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const flagged = !r.player_id;
                  return (
                    <tr key={r.key} className="border-b border-[#111420]">
                      <td className="py-1.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          {flagged && <span title="No player match">⚠</span>}
                          <input
                            value={r.name}
                            onChange={(e) => {
                              const name = e.target.value;
                              const hit = matchPlayer(name, players);
                              patch(r.key, { name, player_id: hit?.id ?? r.player_id });
                            }}
                            className={`w-40 rounded-md border bg-[#111420] px-2 py-1.5 text-[12px] text-[#e2e4ea] focus:outline-none ${
                              flagged ? 'border-[#ff465577]' : 'border-[#1e2130]'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="py-1.5 pr-2">
                        <select
                          value={r.player_id}
                          onChange={(e) => patch(r.key, { player_id: e.target.value })}
                          className={`w-44 rounded-md border bg-[#111420] px-2 py-1.5 text-[12px] text-[#e2e4ea] focus:outline-none ${
                            flagged ? 'border-[#ff465577]' : 'border-[#1e2130]'
                          }`}
                        >
                          <option value="">— pick —</option>
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.username} ({p.in_game_name})
                            </option>
                          ))}
                        </select>
                      </td>
                      {NUM_FIELDS.map(([k]) => (
                        <td key={k} className="px-1 py-1.5 text-center">
                          <input
                            type="number"
                            value={r[k]}
                            onChange={(e) => patch(r.key, { [k]: Number(e.target.value) || 0 } as Partial<Row>)}
                            className={cellInput}
                          />
                        </td>
                      ))}
                      <td className="border-l border-[#1e2130] px-1 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={r.win}
                          onChange={(e) => patch(r.key, { win: e.target.checked })}
                        />
                      </td>
                      {BONUS_FIELDS.map(([k]) => (
                        <td key={k} className="px-1 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={r[k]}
                            onChange={(e) => patch(r.key, { [k]: e.target.checked } as Partial<Row>)}
                          />
                        </td>
                      ))}
                      <td className="border-l border-[#1e2130] px-1 py-1.5 text-center font-display text-[12px] font-bold text-white">
                        {rowPoints(r)}
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setRows((rs) => rs.filter((x) => x.key !== r.key));
                            setSaveMsg(null);
                          }}
                          className="text-[#5a5f78] hover:text-[#ff4655]"
                          aria-label="Remove row"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={save}
              disabled={!ready || saving}
              className="rounded-md bg-[#ff4655] px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[.04em] text-white transition-colors hover:bg-[#ff5b68] disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save game'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRows([]);
                setSaveMsg(null);
                setScanError(null);
              }}
              className="text-[12px] font-medium text-[#8b8fa8] hover:text-white"
            >
              Clear
            </button>
            {saveMsg && (
              <span className={`text-[12px] ${saveMsg.ok ? 'text-[#4ade80]' : 'text-[#ff4655]'}`}>
                {saveMsg.text}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
