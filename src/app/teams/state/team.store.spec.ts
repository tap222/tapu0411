import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TeamStore } from './team.store';
import { TeamGraphQLService } from '../services/team-graphql.service';
import { NotificationService } from '../../core/services/notification.service';
import { CacheService } from '../../common/services/cache.service';
import { Team } from '../models/team.model';

describe('TeamStore - Optimistic Updates & Rollback', () => {
  let store: TeamStore;
  let mockTeamService: {
    getTeams$: ReturnType<typeof vi.fn>;
    createTeam$: ReturnType<typeof vi.fn>;
    deleteTeam$: ReturnType<typeof vi.fn>;
  };
  let mockNotification: {
    info: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const initialTeam: Team = {
    id: '1',
    trainer_id: 1,
    name: 'Kanto Starters',
    pokemon_ids: [25, 6, 9],
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockTeamService = {
      getTeams$: vi.fn().mockReturnValue(of([initialTeam])),
      createTeam$: vi.fn(),
      deleteTeam$: vi.fn(),
    };

    mockNotification = {
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TeamStore,
        { provide: TeamGraphQLService, useValue: mockTeamService },
        { provide: NotificationService, useValue: mockNotification },
        CacheService,
      ],
    });

    store = TestBed.inject(TeamStore);
    (store as any).updateState({ teams: [initialTeam] });
  });

  it('should immediately add team optimistically, then reconcile on server success', () => {
    const serverConfirmedTeam: Team = {
      id: '2',
      trainer_id: 1,
      name: 'Johto Squad',
      pokemon_ids: [157, 181],
      created_at: '2024-02-01T00:00:00Z',
    };

    mockTeamService.createTeam$.mockReturnValue(of(serverConfirmedTeam));

    store.createTeam({
      name: 'Johto Squad',
      pokemon_ids: [157, 181],
      trainer_id: 1,
    });

    // Reconciled with server confirmed ID
    expect(store.snapshot.teams.length).toBe(2);
    expect(store.snapshot.teams[0].id).toBe('2');
    expect(store.snapshot.teams[0].name).toBe('Johto Squad');
    expect(mockNotification.success).toHaveBeenCalledWith(expect.stringContaining('saved successfully'));
  });

  it('should roll back state to snapshot when server mutation fails', () => {
    mockTeamService.createTeam$.mockReturnValue(
      throwError(() => new Error('Server mutation network timeout')),
    );

    expect(store.snapshot.teams.length).toBe(1);

    store.createTeam({
      name: 'Failed Team',
      pokemon_ids: [1, 2],
      trainer_id: 1,
    });

    // Rollback assertion: State returns to initial snapshot of 1 team
    expect(store.snapshot.teams.length).toBe(1);
    expect(store.snapshot.teams[0].name).toBe('Kanto Starters');
    expect(store.snapshot.error).toBe('Server mutation network timeout');
    expect(mockNotification.error).toHaveBeenCalledWith(expect.stringContaining('Changes rolled back'));
  });

  it('should optimistically delete team and roll back on error', () => {
    mockTeamService.deleteTeam$.mockReturnValue(
      throwError(() => new Error('Database constraint error')),
    );

    expect(store.snapshot.teams.length).toBe(1);

    store.deleteTeam('1');

    // Rollback restored the deleted team
    expect(store.snapshot.teams.length).toBe(1);
    expect(store.snapshot.teams[0].id).toBe('1');
    expect(mockNotification.error).toHaveBeenCalledWith(expect.stringContaining('Team restored'));
  });
});
