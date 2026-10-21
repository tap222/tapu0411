import { Observable, combineLatest, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { PokemonStore } from './pokemon.store';
import { Pokemon } from '../models/pokemon.model';

export type SortField = 'id' | 'name' | 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed' | 'totalStats';
export type SortDirection = 'asc' | 'desc';

/**
 * Returns an observable stream of all Pokémon entities ordered by IDs.
 */
export function selectAllPokemon$(store: PokemonStore): Observable<Pokemon[]> {
  return store.stateStream$.pipe(
    map((state) => state.ids.map((id) => state.pokemonMap[id]).filter((p): p is Pokemon => !!p)),
    distinctUntilChanged((prev, curr) => prev.length === curr.length && prev[0]?.id === curr[0]?.id),
    shareReplay(1),
  );
}

/**
 * Returns an observable stream of the catalog loading status.
 */
export function selectLoading$(store: PokemonStore): Observable<boolean> {
  return store.stateStream$.pipe(
    map((state) => state.isLoading),
    distinctUntilChanged(),
    shareReplay(1),
  );
}

/**
 * Returns an observable stream of catalog error message.
 */
export function selectError$(store: PokemonStore): Observable<string | null> {
  return store.stateStream$.pipe(
    map((state) => state.error),
    distinctUntilChanged(),
    shareReplay(1),
  );
}

/**
 * Returns an observable stream of the currently selected Pokémon details.
 */
export function selectSelectedPokemon$(store: PokemonStore): Observable<Pokemon | null> {
  return store.stateStream$.pipe(
    map((state) => {
      if (state.selectedId === null) return null;
      const pokemon = state.pokemonMap[state.selectedId];
      if (!pokemon) return null;
      return {
        ...pokemon,
        abilities: state.selectedAbilities.length > 0 ? state.selectedAbilities : pokemon.abilities,
      };
    }),
    distinctUntilChanged((prev, curr) => prev?.id === curr?.id && prev?.abilities?.length === curr?.abilities?.length),
    shareReplay(1),
  );
}

/**
 * Returns an observable stream of abilities loading status for detail panel.
 */
export function selectAbilitiesLoading$(store: PokemonStore): Observable<boolean> {
  return store.stateStream$.pipe(
    map((state) => state.isLoadingAbilities),
    distinctUntilChanged(),
    shareReplay(1),
  );
}

/**
 * Returns filtered, sorted observable stream combining query, type filter, and sort options.
 * Matches RxJS requirements: combineLatest + distinctUntilChanged + map + shareReplay(1).
 */
export function selectFilteredSortedPokemon$(
  store: PokemonStore,
  searchQuery$: Observable<string>,
  typeFilter$: Observable<string>,
  sortField$: Observable<SortField>,
  sortDirection$: Observable<SortDirection>,
): Observable<Pokemon[]> {
  return combineLatest([
    selectAllPokemon$(store),
    searchQuery$.pipe(distinctUntilChanged()),
    typeFilter$.pipe(distinctUntilChanged()),
    sortField$.pipe(distinctUntilChanged()),
    sortDirection$.pipe(distinctUntilChanged()),
  ]).pipe(
    map(([pokemonList, query, selectedType, field, direction]) => {
      let filtered = pokemonList;

      // 1. Filter by Name / ID
      const trimmedQuery = query.toLowerCase().trim();
      if (trimmedQuery) {
        filtered = filtered.filter(
          (p) => p.name.toLowerCase().includes(trimmedQuery) || String(p.id).includes(trimmedQuery),
        );
      }

      // 2. Filter by Type
      if (selectedType && selectedType !== 'all') {
        filtered = filtered.filter((p) => p.types.includes(selectedType.toLowerCase()));
      }

      // 3. Sort by Field
      const factor = direction === 'asc' ? 1 : -1;
      return [...filtered].sort((a, b) => {
        const valA = a[field];
        const valB = b[field];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * factor;
        }
        return ((valA as number) - (valB as number)) * factor;
      });
    }),
    shareReplay(1),
  );
}
