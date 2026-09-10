export type RankRow = {
  id: number;
  rank_name: string;
  rank_value: number | null;
};

export type Player = {
  id: string;
  username: string;
  in_game_name: string;
  discord_name: string | null;
  current_rank_id: number | null;
  ranks: Pick<RankRow, 'rank_name' | 'rank_value'>[] | null;
};

export type Match = {
  id: number;
  match_number: number;
  match_date: string | null;
  match_season: number | null;
};

export type Game = {
  id: number;
  match_id: number;
  game_number: 1 | 2 | 3;
};

export type GamePlayerStat = {
  player_id: string;
  username: string;
  in_game_name: string;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  econ_rating: number;
  first_bloods: number;
  plants: number;
  defuses: number;
  win: boolean;
  bonus_death: boolean;
  bonus_assist: boolean;
  bonus_fb: boolean;
  bonus_plant: boolean;
  bonus_defuse: boolean;
};

export type GameDetail = {
  id: number;
  game_number: number;
  players: GamePlayerStat[];
};

export type GameStat = {
  id: number;
  game_id: number;
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
  bonus_death: boolean;
  bonus_assist: boolean;
  bonus_fb: boolean;
  bonus_plant: boolean;
  bonus_defuse: boolean;
};
