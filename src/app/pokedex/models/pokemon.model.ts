export interface PokemonStat {
  name: string;
  base_stat: number;
}

export interface PokemonAbility {
  name: string;
  short_effect: string;
  is_hidden: boolean;
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  totalStats: number;
  spriteUrl: string;
  artworkUrl: string;
  abilities?: PokemonAbility[];
}

export interface PokeApiPokemonItem {
  id: number;
  name: string;
  height: number;
  weight: number;
  pokemon_v2_pokemontypes: Array<{
    pokemon_v2_type: {
      name: string;
    };
  }>;
  pokemon_v2_pokemonstats: Array<{
    base_stat: number;
    pokemon_v2_stat: {
      name: string;
    };
  }>;
  pokemon_v2_pokemonsprites: Array<{
    sprites: string | Record<string, unknown>;
  }>;
}

export interface PokeApiPokemonResponse {
  data?: {
    pokemon_v2_pokemon: PokeApiPokemonItem[];
  };
  errors?: Array<{ message: string }>;
}

export interface PokeApiAbilityItem {
  pokemon_v2_ability: {
    name: string;
    pokemon_v2_abilityeffecttexts: Array<{
      short_effect: string;
    }>;
  };
  is_hidden: boolean;
}

export interface PokeApiAbilitiesResponse {
  data?: {
    pokemon_v2_pokemonability: PokeApiAbilityItem[];
  };
  errors?: Array<{ message: string }>;
}
