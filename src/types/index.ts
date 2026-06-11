export type Participant = {
  id: string;
  display_name: string;
  in_game_name: string;
  discord_handle: string;
  // legal_name is intentionally absent — admin-only, never exposed to public endpoints
};

export type Match = {
  id: number;
  round: number; // 1–8 regular season, 9 = final
  played_at: string | null;
};

export type Game = {
  id: number;
  match_id: number;
  game_number: 1 | 2 | 3;
};

export type Score = {
  id: number;
  game_id: number;
  participant_id: string;
  points: number;
};

export type RankRow = {
  id: number;
  rank_name: string;
  rank_value: number;
};
