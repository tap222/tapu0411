import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, retry, throwError } from 'rxjs';
import {
  Pokemon,
  PokemonAbility,
  PokeApiPokemonResponse,
  PokeApiAbilitiesResponse,
  PokeApiPokemonItem,
} from '../models/pokemon.model';
import { CacheService } from '../../common/services/cache.service';
import { environment } from '../../../environments/environment';

const GET_POKEMON_QUERY = /* GraphQL */ `
  query GetPokemon($limit: Int, $offset: Int) {
    pokemon_v2_pokemon(limit: $limit, offset: $offset, order_by: { id: asc }) {
      id
      name
      height
      weight
      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat {
          name
        }
      }
      pokemon_v2_pokemonsprites {
        sprites
      }
    }
  }
`;

const GET_ABILITIES_QUERY = /* GraphQL */ `
  query GetAbilities($pokemonId: Int) {
    pokemon_v2_pokemonability(where: { pokemon_id: { _eq: $pokemonId } }) {
      pokemon_v2_ability {
        name
        pokemon_v2_abilityeffecttexts(where: { language_id: { _eq: 9 } }) {
          short_effect
        }
      }
      is_hidden
    }
  }
`;

/**
 * Service for querying Pokémon data from the public PokéAPI GraphQL endpoint.
 * Features retry resilience and in-memory caching.
 */
@Injectable({ providedIn: 'root' })
export class PokeApiGraphQLService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);

  /**
   * Fetches a paginated list of Pokémon with stats, types, and sprites.
   *
   * @param limit Number of Pokémon to retrieve
   * @param offset Starting offset
   */
  getPokemonList$(limit: number, offset: number): Observable<Pokemon[]> {
    const cacheKey = `pokeapi_list_${limit}_${offset}`;
    const cached = this.cacheService.getInApp<Pokemon[]>(cacheKey);
    if (cached) {
      return of(cached);
    }

    return this.http
      .post<PokeApiPokemonResponse>(environment.pokeApiGraphqlUrl, {
        query: GET_POKEMON_QUERY,
        variables: { limit, offset },
      })
      .pipe(
        // Resilience: retry with delay on PokéAPI calls per task specification
        retry({ count: 2, delay: 1000 }),
        map((response) => {
          if (response.errors && response.errors.length > 0) {
            throw new Error(response.errors[0].message || 'Failed to fetch Pokémon list');
          }
          const items = response.data?.pokemon_v2_pokemon || [];
          const transformed = items.map((item) => this.mapPokemonItem(item));
          this.cacheService.setInApp(cacheKey, transformed, environment.cacheTtlMs);
          return transformed;
        }),
        catchError((error) => {
          return throwError(() => error);
        }),
      );
  }

  /**
   * Fetches abilities and descriptions for a single Pokémon by ID.
   *
   * @param pokemonId ID of the Pokémon
   */
  getAbilities$(pokemonId: number): Observable<PokemonAbility[]> {
    const cacheKey = `pokeapi_abilities_${pokemonId}`;
    const cached = this.cacheService.getInApp<PokemonAbility[]>(cacheKey);
    if (cached) {
      return of(cached);
    }

    return this.http
      .post<PokeApiAbilitiesResponse>(environment.pokeApiGraphqlUrl, {
        query: GET_ABILITIES_QUERY,
        variables: { pokemonId },
      })
      .pipe(
        retry({ count: 2, delay: 1000 }),
        map((response) => {
          if (response.errors && response.errors.length > 0) {
            throw new Error(response.errors[0].message || 'Failed to fetch abilities');
          }
          const raw = response.data?.pokemon_v2_pokemonability || [];
          const abilities: PokemonAbility[] = raw.map((item) => ({
            name: item.pokemon_v2_ability.name,
            short_effect: item.pokemon_v2_ability.pokemon_v2_abilityeffecttexts[0]?.short_effect || 'No description available.',
            is_hidden: item.is_hidden,
          }));

          this.cacheService.setInApp(cacheKey, abilities, environment.cacheTtlMs);
          return abilities;
        }),
        catchError((error) => {
          return throwError(() => error);
        }),
      );
  }

  private mapPokemonItem(raw: PokeApiPokemonItem): Pokemon {
    const types = raw.pokemon_v2_pokemontypes.map((t) => t.pokemon_v2_type.name);

    let hp = 0;
    let attack = 0;
    let defense = 0;
    let specialAttack = 0;
    let specialDefense = 0;
    let speed = 0;

    raw.pokemon_v2_pokemonstats.forEach((s) => {
      const name = s.pokemon_v2_stat.name;
      const val = s.base_stat;
      if (name === 'hp') hp = val;
      else if (name === 'attack') attack = val;
      else if (name === 'defense') defense = val;
      else if (name === 'special-attack') specialAttack = val;
      else if (name === 'special-defense') specialDefense = val;
      else if (name === 'speed') speed = val;
    });

    const totalStats = hp + attack + defense + specialAttack + specialDefense + speed;

    let spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${raw.id}.png`;
    let artworkUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${raw.id}.png`;

    try {
      const spriteObj = raw.pokemon_v2_pokemonsprites?.[0]?.sprites;
      if (typeof spriteObj === 'string') {
        const parsed = JSON.parse(spriteObj);
        if (parsed.front_default) spriteUrl = parsed.front_default;
        if (parsed.other?.['official-artwork']?.front_default) {
          artworkUrl = parsed.other['official-artwork'].front_default;
        }
      } else if (spriteObj && typeof spriteObj === 'object') {
        const anySprite = spriteObj as Record<string, unknown>;
        if (anySprite['front_default']) spriteUrl = anySprite['front_default'] as string;
      }
    } catch {
      // Fallback URLs
    }

    return {
      id: raw.id,
      name: raw.name,
      height: raw.height,
      weight: raw.weight,
      types,
      hp,
      attack,
      defense,
      specialAttack,
      specialDefense,
      speed,
      totalStats,
      spriteUrl,
      artworkUrl,
    };
  }
}
