import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

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

  readonly teams = toSignal(
    this.teamStore.stateStream$.pipe(map((state) => state.teams)),
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

  ngOnInit(): void {
    this.teamStore.loadTeams();
    this.pokemonStore.loadInitial(50);
  }

  getPokemon(id: number): Pokemon | undefined {
    return this.pokemonStore.snapshot.pokemonMap[id];
  }

  onDelete(team: Team): void {
    if (confirm(`Are you sure you want to delete "${team.name}"?`)) {
      this.teamStore.deleteTeam(team.id);
    }
  }

  onRetry(): void {
    this.teamStore.loadTeams();
  }
}
