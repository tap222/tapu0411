export interface TeamTrainer {
  id: string;
  name: string;
  region: string;
  avatar_url?: string;
}

export interface Team {
  id: string;
  trainer_id: number;
  name: string;
  pokemon_ids: number[];
  created_at: string;
  trainer?: TeamTrainer;
}

export interface CreateTeamInput {
  name: string;
  pokemon_ids: number[];
  trainer_id?: number;
}
