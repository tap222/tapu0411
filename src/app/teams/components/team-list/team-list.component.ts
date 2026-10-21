import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs';

import { TeamStore } from '../../state/team.store';
import { Team } from '../../models/team.model';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { DataStateViewComponent } from '../../../common/components/data-state-view/data-state-view.component';
import { SkeletonLoaderComponent } from '../../../common/components/skeleton-loader/skeleton-loader.component';
import { PokemonStore } from '../../../pokedex/state/pokemon.store';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DataStateViewComponent, SkeletonLoaderComponent],
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamListComponent implements OnInit {
  readonly teamStore = inject(TeamStore);
  readonly pokemonStore = inject(PokemonStore);

  // Selected Team Signal
  readonly selectedTeamId = signal<string | null>(null);
  readonly isAnalysisOpen = signal<boolean>(false);

  // Store streams bridged to Signals
  readonly teams = toSignal(
    this.teamStore.stateStream$.pipe(
      map((state) => state.teams),
      tap((teams) => {
        if (teams.length > 0) {
          const allIds = Array.from(new Set(teams.flatMap((t) => t.pokemon_ids)));
          this.pokemonStore.ensurePokemonLoaded(allIds);
          if (!this.selectedTeamId()) {
            this.selectedTeamId.set(teams[0].id);
          }
        }
      }),
    ),
    { initialValue: [] },
  );

  readonly isLoading = toSignal(
    this.teamStore.stateStream$.pipe(map((state) => state.isLoading)),
    { initialValue: false },
  );

  readonly error = toSignal(
    this.teamStore.stateStream$.pipe(map((state) => state.error)),
    { initialValue: null },
  );

  // Computed Derived State per Angular Signals specifications
  readonly selectedTeam = computed(() => {
    const id = this.selectedTeamId();
    return this.teams().find((t) => t.id === id) || null;
  });

  readonly selectedTeamPokemon = computed(() => {
    const team = this.selectedTeam();
    if (!team) return [];
    return team.pokemon_ids
      .map((id) => this.getPokemon(id))
      .filter((p): p is Pokemon => !!p);
  });

  readonly teamTotalBaseStats = computed(() => {
    return this.selectedTeamPokemon().reduce((sum, p) => sum + p.totalStats, 0);
  });

  readonly teamAvgStats = computed(() => {
    const count = this.selectedTeamPokemon().length;
    return count > 0 ? Math.round(this.teamTotalBaseStats() / count) : 0;
  });

  readonly teamTypeDistribution = computed(() => {
    const dist: Record<string, number> = {};
    for (const p of this.selectedTeamPokemon()) {
      for (const t of p.types) {
        dist[t] = (dist[t] || 0) + 1;
      }
    }
    const total = this.selectedTeamPokemon().length || 1;
    return Object.entries(dist).map(([type, count]) => ({
      type,
      count,
      percent: Math.round((count / total) * 100),
    }));
  });

  constructor() {
    // Angular effect() to persist selected active team to localStorage per specification
    effect(() => {
      const activeId = this.selectedTeamId();
      if (activeId) {
        this.teamStore.selectTeam(activeId);
      }
    });
  }

  ngOnInit(): void {
    this.teamStore.loadTeams();
    this.pokemonStore.loadInitial(60);
  }

  getPokemon(id: number): Pokemon | undefined {
    return this.pokemonStore.snapshot.pokemonMap[id];
  }

  onSelectTeam(team: Team): void {
    this.selectedTeamId.set(team.id);
    this.isAnalysisOpen.set(true);
    // Ensure all members are loaded
    this.pokemonStore.ensurePokemonLoaded(team.pokemon_ids);
  }

  closeAnalysis(): void {
    this.isAnalysisOpen.set(false);
  }

  onDelete(arg1: Team | Event, arg2?: Team | Event): void {
    const event = (arg1 instanceof Event ? arg1 : arg2 instanceof Event ? arg2 : undefined);
    const team = (arg1 instanceof Event ? (arg2 as Team) : (arg1 as Team));

    event?.stopPropagation();
    if (!team || !team.id) return;

    if (confirm(`Are you sure you want to delete "${team.name}"?`)) {
      if (this.selectedTeamId() === team.id) {
        this.selectedTeamId.set(null);
        this.isAnalysisOpen.set(false);
      }
      this.teamStore.deleteTeam(team.id);
    }
  }

  onRetry(): void {
    this.teamStore.loadTeams();
  }
}
