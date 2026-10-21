import { describe, it, expect } from 'vitest';
import {
  calculateTeamTotalStats,
  calculateTeamAverageStats,
  calculateTypeDistribution,
  filterAvailablePokemon,
} from './team-analytics.utils';
import { Pokemon } from '../../pokedex/models/pokemon.model';

const createMockPokemon = (id: number, name: string, totalStats: number, types: string[]): Pokemon => ({
  id,
  name,
  height: 10,
  weight: 100,
  types,
  hp: 50,
  attack: 50,
  defense: 50,
  specialAttack: 50,
  specialDefense: 50,
  speed: 50,
  totalStats,
  spriteUrl: `https://example.com/${id}.png`,
  artworkUrl: `https://example.com/art/${id}.png`,
});

describe('Team Analytics Functional Utilities', () => {
  const pika = createMockPokemon(25, 'pikachu', 320, ['electric']);
  const char = createMockPokemon(6, 'charizard', 534, ['fire', 'flying']);
  const blast = createMockPokemon(9, 'blastoise', 530, ['water']);
  const bulb = createMockPokemon(1, 'bulbasaur', 318, ['grass', 'poison']);

  describe('calculateTeamTotalStats', () => {
    it('should return 0 when team roster is empty', () => {
      expect(calculateTeamTotalStats([])).toBe(0);
    });

    it('should accurately aggregate base stats across multiple members', () => {
      const roster = [pika, char, blast];
      const expectedTotal = 320 + 534 + 530; // 1384
      expect(calculateTeamTotalStats(roster)).toBe(expectedTotal);
    });

    it('should handle missing totalStats by defaulting safely to 0', () => {
      const corruptPokemon = { ...pika, totalStats: (undefined as unknown as number) };
      expect(calculateTeamTotalStats([corruptPokemon])).toBe(0);
    });

    it('should maintain strict immutability and not mutate the input array', () => {
      const original = Object.freeze([pika, char]);
      const total = calculateTeamTotalStats(original);
      expect(total).toBe(854);
      expect(original.length).toBe(2);
    });
  });

  describe('calculateTeamAverageStats', () => {
    it('should return 0 when team roster is empty without division-by-zero errors', () => {
      expect(calculateTeamAverageStats([])).toBe(0);
    });

    it('should calculate rounded average base stats for a single member', () => {
      expect(calculateTeamAverageStats([pika])).toBe(320);
    });

    it('should round fractional averages to the nearest integer', () => {
      // 320 + 534 = 854 / 2 = 427
      expect(calculateTeamAverageStats([pika, char])).toBe(427);

      // (320 + 534 + 318) = 1172 / 3 = 390.666... -> 391
      expect(calculateTeamAverageStats([pika, char, bulb])).toBe(391);
    });
  });

  describe('calculateTypeDistribution', () => {
    it('should return an empty array when given an empty roster', () => {
      expect(calculateTypeDistribution([])).toEqual([]);
    });

    it('should compute 100% type distribution for mono-type team', () => {
      const distribution = calculateTypeDistribution([pika]);
      expect(distribution).toEqual([
        { type: 'electric', count: 1, percent: 100 },
      ]);
    });

    it('should correctly account for dual-type members and compute percentages based on roster size', () => {
      // charizard has ['fire', 'flying'], blastoise has ['water']
      // 2 pokemon -> fire: 1 (50%), flying: 1 (50%), water: 1 (50%)
      const dist = calculateTypeDistribution([char, blast]);

      expect(dist.length).toBe(3);
      expect(dist.find((d) => d.type === 'fire')?.percent).toBe(50);
      expect(dist.find((d) => d.type === 'flying')?.percent).toBe(50);
      expect(dist.find((d) => d.type === 'water')?.percent).toBe(50);
    });

    it('should normalize uppercase or mixed-case types to lowercase', () => {
      const mixedPika = createMockPokemon(25, 'pikachu', 320, ['ELECTRIC']);
      const lowerPika = createMockPokemon(26, 'raichu', 485, ['electric']);

      const dist = calculateTypeDistribution([mixedPika, lowerPika]);
      expect(dist.length).toBe(1);
      expect(dist[0].type).toBe('electric');
      expect(dist[0].count).toBe(2);
      expect(dist[0].percent).toBe(100);
    });

    it('should sort output by count descending, then alphabetically by type name', () => {
      // charizard: fire, flying
      // moltres: fire, flying
      // blastoise: water
      const moltres = createMockPokemon(146, 'moltres', 580, ['fire', 'flying']);
      const dist = calculateTypeDistribution([char, moltres, blast]);

      // fire (2), flying (2) -> alphabetical tie-break: fire before flying
      // water (1)
      expect(dist[0].type).toBe('fire');
      expect(dist[0].count).toBe(2);
      expect(dist[1].type).toBe('flying');
      expect(dist[1].count).toBe(2);
      expect(dist[2].type).toBe('water');
      expect(dist[2].count).toBe(1);
    });
  });

  describe('filterAvailablePokemon', () => {
    const catalog = [bulb, char, blast, pika];

    it('should return empty list when search query is empty or whitespace', () => {
      const selected = new Set<number>();
      expect(filterAvailablePokemon(catalog, selected, '')).toEqual([]);
      expect(filterAvailablePokemon(catalog, selected, '   ')).toEqual([]);
    });

    it('should filter candidates by case-insensitive name match', () => {
      const selected = new Set<number>();
      const results = filterAvailablePokemon(catalog, selected, 'PIKA');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('pikachu');
    });

    it('should filter candidates by numerical ID string match', () => {
      const selected = new Set<number>();
      const results = filterAvailablePokemon(catalog, selected, '25');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe(25);
    });

    it('should strictly exclude Pokémon that are already selected in the team', () => {
      const selected = new Set<number>([25]); // Pikachu is already selected
      const results = filterAvailablePokemon(catalog, selected, 'pika');
      expect(results.length).toBe(0);
    });

    it('should enforce the maximum limit parameter', () => {
      const selected = new Set<number>();
      // 'a' matches bulbasaur, charizard, blastoise, pikachu (all 4)
      const results = filterAvailablePokemon(catalog, selected, 'a', 2);
      expect(results.length).toBe(2);
    });
  });
});
