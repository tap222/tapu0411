import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, of, tap } from 'rxjs';
import { Pokemon, PokemonAbility } from '../models/pokemon.model';
import { PokeApiGraphQLService } from '../services/pokeapi-graphql.service';

export interface PokemonState {
  pokemonMap: Record<number, Pokemon>;
  ids: number[];
  selectedId: number | null;
  selectedAbilities: PokemonAbility[];
  isLoading: boolean;
  isLoadingAbilities: boolean;
  error: string | null;
  abilitiesError: string | null;
  hasMore: boolean;
  offset: number;
}

const initialState: PokemonState = {
  pokemonMap: {},
  ids: [],
  selectedId: null,
  selectedAbilities: [],
  isLoading: false,
  isLoadingAbilities: false,
  error: null,
  abilitiesError: null,
  hasMore: true,
  offset: 0,
};

/**
 * Custom BehaviorSubject-based reactive store for Pokémon catalog data.
 * Adheres strictly to RxJS State Management requirements in Pokemon Task.pdf Section 2.
 */
@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private readonly pokeApiService = inject(PokeApiGraphQLService);
  private readonly state$ = new BehaviorSubject<PokemonState>(initialState);

  /** Observable stream of complete store state */
  readonly stateStream$: Observable<PokemonState> = this.state$.asObservable();

  /**
   * Returns current synchronous snapshot of store state.
   */
  get snapshot(): PokemonState {
    return this.state$.getValue();
  }

  /**
   * Loads initial batch of Pokémon from PokéAPI.
   *
   * @param limit Number of items to fetch
   */
  loadInitial(limit = 25): void {
    if (this.snapshot.ids.length > 0 && !this.snapshot.error) {
      return; // Already populated from in-memory cache
    }

    this.updateState({ isLoading: true, error: null, offset: 0 });

    this.pokeApiService
      .getPokemonList$(limit, 0)
      .pipe(
        tap((items) => {
          const pokemonMap: Record<number, Pokemon> = {};
          const ids: number[] = [];

          items.forEach((p) => {
            pokemonMap[p.id] = p;
            ids.push(p.id);
          });

          this.updateState({
            pokemonMap,
            ids,
            offset: items.length,
            hasMore: items.length === limit,
            error: null,
          });
        }),
        catchError((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to load Pokémon list.';
          this.updateState({ error: msg });
          return of([]);
        }),
        finalize(() => {
          this.updateState({ isLoading: false });
        }),
      )
      .subscribe();
  }

  /**
   * Fetches the next batch of Pokémon and appends to the store (for infinite scrolling).
   *
   * @param limit Batch size
   */
  loadNextBatch(limit = 25): void {
    const { isLoading, hasMore, offset, pokemonMap, ids } = this.snapshot;
    if (isLoading || !hasMore) return;

    this.updateState({ isLoading: true, error: null });

    this.pokeApiService
      .getPokemonList$(limit, offset)
      .pipe(
        tap((newItems) => {
          const updatedMap = { ...pokemonMap };
          const updatedIds = [...ids];

          newItems.forEach((p) => {
            if (!updatedMap[p.id]) {
              updatedMap[p.id] = p;
              updatedIds.push(p.id);
            }
          });

          this.updateState({
            pokemonMap: updatedMap,
            ids: updatedIds,
            offset: offset + newItems.length,
            hasMore: newItems.length === limit,
          });
        }),
        catchError((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to fetch next Pokémon page.';
          this.updateState({ error: msg });
          return of([]);
        }),
        finalize(() => {
          this.updateState({ isLoading: false });
        }),
      )
      .subscribe();
  }

  /**
   * Ensures that specific Pokémon IDs are fetched and stored in the catalog.
   * Useful for displaying team roster details.
   *
   * @param ids Array of Pokémon IDs
   */
  ensurePokemonLoaded(ids: number[]): void {
    const missing = ids.filter((id) => !this.snapshot.pokemonMap[id]);
    if (missing.length === 0) return;

    this.pokeApiService
      .getPokemonByIds$(missing)
      .pipe(
        tap((items) => {
          if (items.length === 0) return;
          const updatedMap = { ...this.snapshot.pokemonMap };
          const updatedIds = [...this.snapshot.ids];

          items.forEach((p) => {
            if (!updatedMap[p.id]) {
              updatedMap[p.id] = p;
              updatedIds.push(p.id);
            }
          });

          this.updateState({
            pokemonMap: updatedMap,
            ids: updatedIds,
          });
        }),
      )
      .subscribe();
  }

  /**
   * Selects a Pokémon and fetches its abilities.
   *
   * @param id Pokémon ID
   */
  selectPokemon(id: number | null): void {
    if (id === null) {
      this.updateState({ selectedId: null, selectedAbilities: [], abilitiesError: null });
      return;
    }

    const currentPokemon = this.snapshot.pokemonMap[id];
    if (currentPokemon && currentPokemon.abilities && currentPokemon.abilities.length > 0) {
      this.updateState({
        selectedId: id,
        selectedAbilities: currentPokemon.abilities,
        abilitiesError: null,
      });
      return;
    }

    this.updateState({
      selectedId: id,
      selectedAbilities: [],
      isLoadingAbilities: true,
      abilitiesError: null,
    });

    this.pokeApiService
      .getAbilities$(id)
      .pipe(
        tap((abilities) => {
          const updatedMap = { ...this.snapshot.pokemonMap };
          if (updatedMap[id]) {
            updatedMap[id] = { ...updatedMap[id], abilities };
          }
          this.updateState({
            pokemonMap: updatedMap,
            selectedAbilities: abilities,
            abilitiesError: null,
          });
        }),
        catchError((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to load abilities.';
          this.updateState({ abilitiesError: msg });
          return of([]);
        }),
        finalize(() => {
          this.updateState({ isLoadingAbilities: false });
        }),
      )
      .subscribe();
  }

  /**
   * Retries the last failed catalog query.
   */
  retry(): void {
    if (this.snapshot.ids.length === 0) {
      this.loadInitial();
    } else {
      this.loadNextBatch();
    }
  }

  private updateState(partial: Partial<PokemonState>): void {
    this.state$.next({
      ...this.state$.getValue(),
      ...partial,
    });
  }
}
