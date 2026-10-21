import { Pokemon } from '../../pokedex/models/pokemon.model';

/**
 * Immutable type representation for calculated team type distribution.
 */
export interface TypeDistributionItem {
  readonly type: string;
  readonly count: number;
  readonly percent: number;
}

/**
 * Pure function: Calculates the aggregate total base stats across all team members.
 * Implements functional reduction with immutability guarantees.
 *
 * @param pokemonList - Readonly array of Pokémon team members
 * @returns Total base stat sum, or 0 if roster is empty
 */
export function calculateTeamTotalStats(pokemonList: readonly Pokemon[]): number {
  return pokemonList.reduce((acc, p) => acc + (p.totalStats || 0), 0);
}

/**
 * Pure function: Calculates the average base stat per Pokémon in the team.
 * Uses integer rounding and guards against division-by-zero.
 *
 * @param pokemonList - Readonly array of Pokémon team members
 * @returns Average base stats rounded to nearest integer, or 0 if roster is empty
 */
export function calculateTeamAverageStats(pokemonList: readonly Pokemon[]): number {
  if (!pokemonList || pokemonList.length === 0) {
    return 0;
  }
  return Math.round(calculateTeamTotalStats(pokemonList) / pokemonList.length);
}

/**
 * Pure function: Computes the frequency and percentage distribution of elemental types in a team.
 * Output is deterministically sorted by count descending, then alphabetically by type name.
 *
 * @param pokemonList - Readonly array of Pokémon team members
 * @returns Sorted array of TypeDistributionItem
 */
export function calculateTypeDistribution(pokemonList: readonly Pokemon[]): readonly TypeDistributionItem[] {
  if (!pokemonList || pokemonList.length === 0) {
    return [];
  }

  const frequencyMap = pokemonList.reduce<Readonly<Record<string, number>>>((acc, pokemon) => {
    const updated = { ...acc };
    for (const t of pokemon.types || []) {
      const normalizedType = t.toLowerCase();
      updated[normalizedType] = (updated[normalizedType] || 0) + 1;
    }
    return updated;
  }, {});

  const totalMembers = pokemonList.length;

  return Object.entries(frequencyMap)
    .map(([type, count]) => ({
      type,
      count,
      percent: Math.round((count / totalMembers) * 100),
    }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
}

/**
 * Pure function: Filters candidates for team membership using case-insensitive substring search
 * and numerical Pokédex ID matching, strictly excluding already selected Pokémon.
 *
 * @param candidates - All available Pokémon in catalog
 * @param selectedIds - Set of IDs already on the team
 * @param query - Raw search query entered by trainer
 * @param limit - Maximum number of results to return (default: 8)
 * @returns Readonly array of matching candidate Pokémon
 */
export function filterAvailablePokemon(
  candidates: readonly Pokemon[],
  selectedIds: ReadonlySet<number>,
  query: string,
  limit = 8
): readonly Pokemon[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) {
    return [];
  }

  return candidates
    .filter((p) => !selectedIds.has(p.id))
    .filter((p) => p.name.toLowerCase().includes(normalizedQuery) || String(p.id).includes(normalizedQuery))
    .slice(0, Math.max(0, limit));
}
