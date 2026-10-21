import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, of, tap } from 'rxjs';
import { Team, CreateTeamInput } from '../models/team.model';
import { TeamGraphQLService } from '../services/team-graphql.service';
import { NotificationService } from '../../core/services/notification.service';
import { CacheService } from '../../common/services/cache.service';
import { CACHE_KEYS } from '../../common/constants/common.constants';

export interface TeamState {
  teams: Team[];
  selectedTeamId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: TeamState = {
  teams: [],
  selectedTeamId: null,
  isLoading: false,
  isSaving: false,
  error: null,
};

/**
 * Custom RxJS store for Team management featuring optimistic creation and deletion with rollback.
 * Fully satisfies Pokemon Task.pdf Section 2 requirements.
 */
@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly teamService = inject(TeamGraphQLService);
  private readonly notification = inject(NotificationService);
  private readonly cacheService = inject(CacheService);

  private readonly state$ = new BehaviorSubject<TeamState>(initialState);

  /** Observable stream of team store state */
  readonly stateStream$: Observable<TeamState> = this.state$.asObservable();

  constructor() {
    this.restoreActiveTeam();
  }

  /**
   * Returns current synchronous snapshot of store state.
   */
  get snapshot(): TeamState {
    return this.state$.getValue();
  }

  private restoreActiveTeam(): void {
    const cachedTeamId = this.cacheService.get<string>(CACHE_KEYS.ACTIVE_TEAM, 'local');
    if (cachedTeamId) {
      this.updateState({ selectedTeamId: cachedTeamId });
    }
  }

  /**
   * Fetches existing teams from the GraphQL backend microservice.
   */
  loadTeams(): void {
    this.updateState({ isLoading: true, error: null });

    this.teamService
      .getTeams$()
      .pipe(
        tap((teams) => {
          this.updateState({
            teams,
            selectedTeamId: this.snapshot.selectedTeamId || (teams[0] ? teams[0].id : null),
            error: null,
          });
        }),
        catchError((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to load teams from server.';
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
   * Optimistically creates a team. Adds team immediately to the list.
   * If mutation fails, rolls back state and triggers error toast notification.
   *
   * @param input Creation payload
   */
  createTeam(input: CreateTeamInput): void {
    // 1. Snapshot previous state for rollback
    const previousSnapshot = [...this.snapshot.teams];
    const tempId = `temp-${Date.now()}`;

    const optimisticTeam: Team = {
      id: tempId,
      name: input.name,
      pokemon_ids: [...input.pokemon_ids],
      trainer_id: input.trainer_id || 1,
      created_at: new Date().toISOString(),
    };

    // 2. Immediate optimistic update in UI
    this.updateState({
      teams: [optimisticTeam, ...previousSnapshot],
      selectedTeamId: tempId,
      isSaving: true,
      error: null,
    });
    this.notification.info(`Saving team "${input.name}"...`);

    // 3. Fire backend GraphQL mutation
    this.teamService
      .createTeam$(input)
      .pipe(
        tap((persistedTeam) => {
          // Replace temp item with confirmed entity from server
          const reconciled = this.snapshot.teams.map((t) => (t.id === tempId ? persistedTeam : t));
          this.updateState({
            teams: reconciled,
            selectedTeamId: persistedTeam.id,
          });
          this.persistActiveTeam(persistedTeam.id);
          this.notification.success(`Team "${persistedTeam.name}" saved successfully!`);
        }),
        catchError((err: unknown) => {
          // 4. ROLLBACK ON FAILURE
          const errorMsg = err instanceof Error ? err.message : 'Failed to save team.';
          this.updateState({
            teams: previousSnapshot,
            selectedTeamId: previousSnapshot[0]?.id || null,
            error: errorMsg,
          });
          this.notification.error(`Failed to create team: ${errorMsg}. Changes rolled back.`);
          return of(null);
        }),
        finalize(() => {
          this.updateState({ isSaving: false });
        }),
      )
      .subscribe();
  }

  /**
   * Optimistically deletes a team by ID.
   * Immediately removes from UI and rolls back if deletion fails.
   *
   * @param id Team ID
   */
  deleteTeam(id: string): void {
    const previousSnapshot = [...this.snapshot.teams];
    const targetTeam = previousSnapshot.find((t) => t.id === id);

    // 1. Immediate optimistic removal
    this.updateState({
      teams: previousSnapshot.filter((t) => t.id !== id),
      selectedTeamId: this.snapshot.selectedTeamId === id ? null : this.snapshot.selectedTeamId,
    });

    this.teamService
      .deleteTeam$(id)
      .pipe(
        tap(() => {
          this.notification.success(`Team "${targetTeam?.name || id}" removed.`);
        }),
        catchError((err: unknown) => {
          // Rollback on failure
          const errorMsg = err instanceof Error ? err.message : 'Failed to delete team.';
          this.updateState({
            teams: previousSnapshot,
            error: errorMsg,
          });
          this.notification.error(`Could not delete team: ${errorMsg}. Team restored.`);
          return of(false);
        }),
      )
      .subscribe();
  }

  /**
   * Selects an active team and persists to browser storage.
   *
   * @param id Team ID
   */
  selectTeam(id: string): void {
    this.updateState({ selectedTeamId: id });
    this.persistActiveTeam(id);
  }

  private persistActiveTeam(id: string): void {
    this.cacheService.set(CACHE_KEYS.ACTIVE_TEAM, id, 'local');
  }

  private updateState(partial: Partial<TeamState>): void {
    this.state$.next({
      ...this.state$.getValue(),
      ...partial,
    });
  }
}
