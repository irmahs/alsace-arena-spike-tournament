export type Locale = 'en' | 'fr';
export const LOCALES: Locale[] = ['en', 'fr'];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'lang';

const dictionaries = {
  en: {
    nav: {
      leaderboard: 'Leaderboard',
    },
    season: (n: number) => `Season ${n}`,
    seasonDash: 'Season —',
    match: (n: number) => `Match ${n}`,
    game: (n: number) => `Game ${n}`,
    gamesPlayed: (n: number) => `${n} game${n === 1 ? '' : 's'} played`,

    home: {
      title: 'Season Leaderboard',
      cumulativeAllGames: 'Cumulative stats across all games',
      matchesPlayed: 'Matches played',
      gamesTotal: 'Games total',
      seasonMvp: (n: number) => `Season ${n} MVP`,
      mvp: 'MVP',
      mvpSubtitle: '#1 across all games this season',
      points: 'Points',
      kills: 'Kills',
      wins: 'Wins',
      pts: 'pts',
      second: '2nd',
      third: '3rd',
      allMatches: 'All matches',
      globalLeaderboard: 'Global leaderboard',
      matchDetail: 'Match detail →',
      player: 'Player',
      statistiques: 'Statistiques',
      bonuses: 'Bonuses',
      total: 'Total',
    },

    matchesPage: {
      title: 'Matches',
      done: 'Done',
      upcoming: 'Upcoming',
      tbd: 'TBD',
      noMatches: 'No matches in this season yet.',
    },

    matchDetail: {
      mvpTitle: 'MVP',
      kda: 'K / D / A',
      acs: 'ACS',
      result: 'Result',
      win: 'Win',
      loss: 'Loss',
      noStats: 'No stats recorded yet.',
      allGamesTotal: 'All games (total)',
      playerStats: 'Player stats',
      firstBloodBonus: 'First blood bonus',
      leastDeathsBonus: 'Least deaths bonus',
      mostAssistsBonus: 'Most assists bonus',
      mostPlantsBonus: 'Most plants bonus',
      mostDefusesBonus: 'Most defuses bonus',
      victory: 'Victory',
    },

    categories: {
      leastDeaths: 'Least deaths',
      mostKills: 'Most kills',
      mostAssists: 'Most assists',
      mostFirstBloods: 'Most first bloods',
      mostPlants: 'Most plants',
      mostDefuses: 'Most defuses',
    },
  },

  fr: {
    nav: {
      leaderboard: 'Classement',
    },
    season: (n: number) => `Saison ${n}`,
    seasonDash: 'Saison —',
    match: (n: number) => `Match ${n}`,
    game: (n: number) => `Partie ${n}`,
    gamesPlayed: (n: number) => `${n} partie${n === 1 ? '' : 's'} jouée${n === 1 ? '' : 's'}`,

    home: {
      title: 'Classement de la saison',
      cumulativeAllGames: 'Statistiques cumulées sur toutes les parties',
      matchesPlayed: 'Matchs joués',
      gamesTotal: 'Parties jouées',
      seasonMvp: (n: number) => `MVP de la saison ${n}`,
      mvp: 'MVP',
      mvpSubtitle: 'N°1 sur toutes les parties de la saison',
      points: 'Points',
      kills: 'Éliminations',
      wins: 'Victoires',
      pts: 'pts',
      second: '2e',
      third: '3e',
      allMatches: 'Tous les matchs',
      globalLeaderboard: 'Classement général',
      matchDetail: 'Détails du match →',
      player: 'Joueur',
      statistiques: 'Statistiques',
      bonuses: 'Bonus',
      total: 'Total',
    },

    matchesPage: {
      title: 'Matchs',
      done: 'Terminé',
      upcoming: 'À venir',
      tbd: 'À définir',
      noMatches: 'Aucun match cette saison pour le moment.',
    },

    matchDetail: {
      mvpTitle: 'MVP',
      kda: 'K / D / A',
      acs: 'ACS',
      result: 'Résultat',
      win: 'Victoire',
      loss: 'Défaite',
      noStats: 'Aucune statistique enregistrée pour le moment.',
      allGamesTotal: 'Toutes les parties (total)',
      playerStats: 'Statistiques des joueurs',
      firstBloodBonus: 'Bonus premier sang',
      leastDeathsBonus: 'Bonus moins de morts',
      mostAssistsBonus: "Bonus plus d'assists",
      mostPlantsBonus: 'Bonus poses de Spike',
      mostDefusesBonus: 'Bonus désamorçages',
      victory: 'Victoire',
    },

    categories: {
      leastDeaths: 'Moins de morts',
      mostKills: "Plus d'éliminations",
      mostAssists: "Plus d'assists",
      mostFirstBloods: 'Plus de premiers sangs',
      mostPlants: 'Plus de poses',
      mostDefuses: 'Plus de désamorçages',
    },
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export type Dictionary = ReturnType<typeof getDictionary>;
