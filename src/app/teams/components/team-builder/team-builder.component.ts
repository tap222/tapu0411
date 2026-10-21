import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';

import { TeamStore } from '../../state/team.store';
import { PokemonStore } from '../../../pokedex/state/pokemon.store';
import { selectAllPokemon$ } from '../../../pokedex/state/pokemon.selectors';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { uniqueTeamNameValidator } from '../../validators/team-name.validator';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './team-builder.component.html',
  styleUrl: './team-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamBuilderComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly teamStore = inject(TeamStore);
  private readonly pokemonStore = inject(PokemonStore);
  readonly authService = inject(AuthService);

  // Autocomplete stream
  readonly searchInput$ = new BehaviorSubject<string>('');
  readonly pickerQuery = signal<string>('');
  readonly isDropdownOpen = signal<boolean>(false);

  // Selected Pokémon list as signal
  readonly selectedPokemon = signal<Pokemon[]>([]);

  // All loaded Pokémon from store
  readonly allPokemon = toSignal(selectAllPokemon$(this.pokemonStore), { initialValue: [] });

  // Filtered typeahead results
  readonly filteredTypeahead = computed(() => {
    const q = this.pickerQuery().toLowerCase().trim();
    if (!q) return [];
    const currentIds = new Set(this.selectedPokemon().map((p) => p.id));
    return this.allPokemon()
      .filter((p) => !currentIds.has(p.id))
      .filter((p) => p.name.toLowerCase().includes(q) || String(p.id).includes(q))
      .slice(0, 8);
  });

  // Computed Team Base Stat Aggregate per Signals requirements
  readonly totalTeamBaseStats = computed(() => {
    return this.selectedPokemon().reduce((sum, p) => sum + p.totalStats, 0);
  });

  // Computed Type Distribution per Signals requirements
  readonly teamTypeDistribution = computed(() => {
    const distribution: Record<string, number> = {};
    for (const p of this.selectedPokemon()) {
      for (const t of p.types) {
        distribution[t] = (distribution[t] || 0) + 1;
      }
    }
    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      percent: Math.round((count / (this.selectedPokemon().length || 1)) * 100),
    }));
  });

  teamForm!: FormGroup;

  ngOnInit(): void {
    this.pokemonStore.loadInitial(60);
    this.teamStore.loadTeams();

    this.teamForm = this.fb.group({
      name: [
        '',
        {
          validators: [Validators.required, Validators.minLength(3), Validators.maxLength(30)],
          asyncValidators: [uniqueTeamNameValidator(this.teamStore)],
          updateOn: 'change',
        },
      ],
    });
  }

  onPickerInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.pickerQuery.set(value);
    this.isDropdownOpen.set(value.trim().length > 0);
  }

  addPokemon(pokemon: Pokemon): void {
    if (this.selectedPokemon().length >= 6) {
      return;
    }
    this.selectedPokemon.set([...this.selectedPokemon(), pokemon]);
    this.pickerQuery.set('');
    this.isDropdownOpen.set(false);
  }

  removePokemon(id: number): void {
    this.selectedPokemon.set(this.selectedPokemon().filter((p) => p.id !== id));
  }

  onSubmit(): void {
    if (this.teamForm.invalid || this.selectedPokemon().length === 0) {
      this.teamForm.markAllAsTouched();
      return;
    }

    const teamName = this.teamForm.value.name.trim();
    const pokemonIds = this.selectedPokemon().map((p) => p.id);
    const trainerId = this.authService.currentUser()?.userId || 1;

    // Optimistic creation flow from Task 2
    this.teamStore.createTeam({
      name: teamName,
      pokemon_ids: pokemonIds,
      trainer_id: trainerId,
    });

    void this.router.navigateByUrl('/teams');
  }
}
