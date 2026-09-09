'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

const links = [
  { href: '/', label: 'Leaderboard', exact: true },
];

function NavLinksInner({ seasons }: { seasons: number[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentSeasonParam = searchParams.get('currentSeason');

  const selectedSeason = currentSeasonParam ?? (seasons.length ? String(seasons[seasons.length - 1]) : '');

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`/?currentSeason=${e.target.value}`);
  }

  return (
    <div className="flex items-center gap-3">
      {seasons.length > 1 && (
        <select
          value={selectedSeason}
          onChange={handleSeasonChange}
          className="text-[12px] font-medium bg-[#111420] border border-[#1e2130] text-[#8b8fa8] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#2a2f44] hover:border-[#2a2f44] cursor-pointer"
        >
          {seasons.map((s) => (
            <option key={s} value={s}>
              Season {s}
            </option>
          ))}
        </select>
      )}

      <div className="flex gap-1">
        {links.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`text-[13px] font-medium px-3.5 py-1.5 rounded-md transition-colors ${
                active
                  ? 'text-white bg-[#1a1e2c]'
                  : 'text-[#8b8fa8] hover:text-white hover:bg-[#1a1e2c]'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function NavLinks({ seasons }: { seasons: number[] }) {
  return (
    <Suspense fallback={
      <div className="flex gap-1">
        {links.map(({ label }) => (
          <span key={label} className="text-[13px] font-medium px-3.5 py-1.5 rounded-md text-[#3d4260]">
            {label}
          </span>
        ))}
      </div>
    }>
      <NavLinksInner seasons={seasons} />
    </Suspense>
  );
}
