import Link from 'next/link';
import { getMatches } from '@/services/matches';
import type { Match } from '@/types';

export default async function Page() {
  const { matches, error } = await getMatches();

  const season = matches.reduce((max, m) => Math.max(max, m.match_season ?? 0), 0) || null;
  const seasonMatches = matches.filter((m: Match) => m.match_season === season);

  return (
    <div>
      <div className="px-7 py-8 border-b border-[#1e2130]">
        <div className="text-[11px] font-semibold text-[#ff4655] tracking-[.14em] uppercase mb-1.5">
          {season ? `Season ${season}` : 'Season —'}
        </div>
        <div className="font-display font-bold text-[32px] text-white leading-none tracking-[.02em]">
          Matches
        </div>
      </div>

      <div className="px-7 py-6">
        {error ? (
          <p className="text-[#ff4655] text-sm">{error}</p>
        ) : (
          <div className="grid grid-cols-3 max-[768px]:grid-cols-1 gap-3">
            {seasonMatches.map((m: Match) => {
              const done = m.match_date !== null;
              return (
                <Link
                  key={m.id}
                  href={`/matches/${m.match_season ?? season}/${m.id}`}
                  className="block bg-[#111420] border border-[#1e2130] hover:border-[#2a2f44] rounded-lg px-4 py-3.5 transition-colors"
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
                  <div className="flex gap-1 mb-2">
                    {[0, 1, 2].map((g) => (
                      <div key={g} className={`flex-1 h-[3px] rounded-sm ${done ? 'bg-[#ff4655]' : 'bg-[#1e2130]'}`} />
                    ))}
                  </div>
                  <div className="text-[11px] text-[#3d4260]">{m.match_date ?? 'TBD'}</div>
                </Link>
              );
            })}
            {seasonMatches.length === 0 && (
              <p className="text-[13px] text-[#5a5f78]">No matches in this season yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
