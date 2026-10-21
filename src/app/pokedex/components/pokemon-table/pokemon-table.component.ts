import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';

import { PokemonStore } from '../../state/pokemon.store';
import {
  selectFilteredSortedPokemon$,
  selectLoading$,
  selectError$,
  selectSelectedPokemon$,
  selectAbilitiesLoading$,
  SortField,
  SortDirection,
} from '../../state/pokemon.selectors';
import { Pokemon } from '../../models/pokemon.model';
import { DataStateViewComponent } from '../../../common/components/data-state-view/data-state-view.component';
import { SkeletonLoaderComponent } from '../../../common/components/skeleton-loader/skeleton-loader.component';
import { PokemonDetailPanelComponent } from '../pokemon-detail-panel/pokemon-detail-panel.component';

@Component({
  selector: 'app-pokemon-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    DataStateViewComponent,
    SkeletonLoaderComponent,
    PokemonDetailPanelComponent,
  ],
  templateUrl: './pokemon-table.component.html',
  styleUrl: './pokemon-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonTableComponent implements OnInit, AfterViewInit {
  private readonly store = inject(PokemonStore);
  private readonly destroyRef = inject(DestroyRef);

  // Filter & Sort subjects
  private readonly searchSubject$ = new BehaviorSubject<string>('');
  private readonly typeSubject$ = new BehaviorSubject<string>('all');
  private readonly sortFieldSubject$ = new BehaviorSubject<SortField>('id');
  private readonly sortDirSubject$ = new BehaviorSubject<SortDirection>('asc');

  // UI state signals
  readonly searchQuery = signal<string>('');
  readonly selectedType = signal<string>('all');
  readonly sortField = signal<SortField>('id');
  readonly sortDirection = signal<SortDirection>('asc');
  readonly isDetailOpen = signal<boolean>(false);

  // Store selector streams bridged to Signals
  readonly pokemonList = toSignal(
    selectFilteredSortedPokemon$(
      this.store,
      this.searchSubject$.pipe(debounceTime(300), distinctUntilChanged()),
      this.typeSubject$,
      this.sortFieldSubject$,
      this.sortDirSubject$,
    ),
    { initialValue: [] },
  );

  readonly isLoading = toSignal(selectLoading$(this.store), { initialValue: false });
  readonly error = toSignal(selectError$(this.store), { initialValue: null });
  readonly selectedPokemon = toSignal(selectSelectedPokemon$(this.store), { initialValue: null });
  readonly isLoadingAbilities = toSignal(selectAbilitiesLoading$(this.store), { initialValue: false });

  // Computed empty state
  readonly isEmpty = computed(() => {
    return !this.isLoading() && !this.error() && this.pokemonList().length === 0;
  });

  // Available Pokémon types for dropdown
  readonly pokemonTypes = [
    'all',
    'normal',
    'fire',
    'water',
    'grass',
    'electric',
    'ice',
    'fighting',
    'poison',
    'ground',
    'flying',
    'psychic',
    'bug',
    'rock',
    'ghost',
    'dragon',
    'steel',
    'fairy',
  ];

  // Viewport reference for CDK Virtual Scroll
  private readonly viewport = viewChild(CdkVirtualScrollViewport);

  // Sentinel anchor for infinite scroll prefetching
  private readonly scrollSentinel = viewChild<ElementRef<HTMLElement>>('scrollSentinel');
  private sentinelObserver?: IntersectionObserver;

  constructor() {
    // Automatically recalculate CDK viewport size whenever the Pokémon list updates
    effect(() => {
      const list = this.pokemonList();
      if (list.length > 0) {
        requestAnimationFrame(() => {
          this.viewport()?.checkViewportSize();
        });
      }
    });
  }

  ngOnInit(): void {
    this.store.loadInitial(40);
  }

  ngAfterViewInit(): void {
    this.setupViewportAutoResize();
    this.setupInfiniteScrollObserver();
  }

  private setupViewportAutoResize(): void {
    // 1. Initial size check after view is mounted
    requestAnimationFrame(() => {
      this.viewport()?.checkViewportSize();
    });

    // 2. Window / container resize observer to dynamically adjust virtual scroll height
    const vpEl = this.viewport()?.elementRef?.nativeElement;
    if (vpEl && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        this.viewport()?.checkViewportSize();
      });
      ro.observe(vpEl);
      this.destroyRef.onDestroy(() => ro.disconnect());
    }

    // 3. Proactive scroll index change listener as secondary infinite-scroll trigger
    this.viewport()
      ?.scrolledIndexChange.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((index) => {
        const total = this.pokemonList().length;
        if (total > 0 && index >= total - 12 && !this.isLoading() && this.store.snapshot.hasMore) {
          this.store.loadNextBatch(25);
        }
      });
  }

  private setupInfiniteScrollObserver(): void {
    const sentinelEl = this.scrollSentinel()?.nativeElement;
    if (!sentinelEl) return;

    this.sentinelObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !this.isLoading() && this.store.snapshot.hasMore) {
          this.store.loadNextBatch(25);
        }
      },
      { rootMargin: '200px' },
    );

    this.sentinelObserver.observe(sentinelEl);

    this.destroyRef.onDestroy(() => {
      this.sentinelObserver?.disconnect();
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject$.next(query);
  }

  clearSearch(): void {
    this.onSearchChange('');
  }

  onTypeChange(type: string): void {
    this.selectedType.set(type);
    this.typeSubject$.next(type);
  }

  sortBy(field: SortField): void {
    if (this.sortField() === field) {
      const newDir: SortDirection = this.sortDirection() === 'asc' ? 'desc' : 'asc';
      this.sortDirection.set(newDir);
      this.sortDirSubject$.next(newDir);
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
      this.sortFieldSubject$.next(field);
      this.sortDirSubject$.next('asc');
    }
  }

  onSelectPokemon(pokemon: Pokemon): void {
    this.store.selectPokemon(pokemon.id);
    this.isDetailOpen.set(true);
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
  }

  trackById(index: number, item: Pokemon): number {
    return item?.id ?? index;
  }

  onRetry(): void {
    this.store.retry();
  }
}
