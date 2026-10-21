import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { PokemonStore } from './pokemon.store';
import { selectFilteredSortedPokemon$ } from './pokemon.selectors';
import { Pokemon } from '../models/pokemon.model';

describe('Pokemon Selectors - Filter & Sort Logic', () => {
  let mockStore: any;

  const samplePokemon: Pokemon[] = [
    {
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      types: ['electric'],
      hp: 35,
      attack: 55,
      defense: 40,
      specialAttack: 50,
      specialDefense: 50,
      speed: 90,
      totalStats: 320,
      spriteUrl: '',
      artworkUrl: '',
    },
    {
      id: 6,
      name: 'charizard',
      height: 17,
      weight: 905,
      types: ['fire', 'flying'],
      hp: 78,
      attack: 84,
      defense: 78,
      specialAttack: 109,
      specialDefense: 85,
      speed: 100,
      totalStats: 534,
      spriteUrl: '',
      artworkUrl: '',
    },
    {
      id: 9,
      name: 'blastoise',
      height: 16,
      weight: 855,
      types: ['water'],
      hp: 79,
      attack: 83,
      defense: 100,
      specialAttack: 85,
      specialDefense: 105,
      speed: 78,
      totalStats: 530,
      spriteUrl: '',
      artworkUrl: '',
    },
  ];

  beforeEach(() => {
    const pokemonMap: Record<number, Pokemon> = {};
    const ids: number[] = [];
    samplePokemon.forEach((p) => {
      pokemonMap[p.id] = p;
      ids.push(p.id);
    });

    mockStore = {
      stateStream$: of({
        pokemonMap,
        ids,
        selectedId: null,
        selectedAbilities: [],
        isLoading: false,
        isLoadingAbilities: false,
        error: null,
        abilitiesError: null,
        hasMore: false,
        offset: 3,
      }),
    };
  });

  it('should filter Pokémon by text query correctly', (done) => {
    selectFilteredSortedPokemon$(
      mockStore,
      of('pika'),
      of('all'),
      of('id'),
      of('asc'),
    ).subscribe((results) => {
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('pikachu');
    });
  });

  it('should filter Pokémon by type correctly', () => {
    selectFilteredSortedPokemon$(
      mockStore,
      of(''),
      of('water'),
      of('id'),
      of('asc'),
    ).subscribe((results) => {
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('blastoise');
    });
  });

  it('should sort Pokémon by stats descending', () => {
    selectFilteredSortedPokemon$(
      mockStore,
      of(''),
      of('all'),
      of('totalStats'),
      of('desc'),
    ).subscribe((results) => {
      expect(results.length).toBe(3);
      expect(results[0].name).toBe('charizard'); // 534 total
      expect(results[1].name).toBe('blastoise'); // 530 total
      expect(results[2].name).toBe('pikachu');   // 320 total
    });
  });
});
