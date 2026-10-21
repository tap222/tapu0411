import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms';
import { firstValueFrom, isObservable } from 'rxjs';
import { uniqueTeamNameValidator } from './team-name.validator';
import { TeamStore } from '../state/team.store';

describe('uniqueTeamNameValidator - Async Team Name Uniqueness', () => {
  const mockTeamStore = {
    snapshot: {
      teams: [
        { id: '1', name: 'Kanto Starters', pokemon_ids: [1, 2, 3], trainer_id: 1, created_at: '' },
        { id: '2', name: 'Johto Squad', pokemon_ids: [4, 5, 6], trainer_id: 1, created_at: '' },
      ],
    },
  } as unknown as TeamStore;

  const validator = uniqueTeamNameValidator(mockTeamStore);

  it('should return null when team name is unique', async () => {
    const control = new FormControl('Hoenn Heroes');
    const result$ = validator(control);

    expect(isObservable(result$)).toBe(true);
    const result = await firstValueFrom(result$ as any);
    expect(result).toBeNull();
  });

  it('should return { teamNameTaken: true } when team name already exists (case-insensitive)', async () => {
    const control = new FormControl('kanto starters');
    const result$ = validator(control);

    const result = await firstValueFrom(result$ as any);
    expect(result).toEqual({ teamNameTaken: true });
  });

  it('should return null for short inputs (< 3 characters)', async () => {
    const control = new FormControl('ab');
    const result$ = validator(control);

    const result = await firstValueFrom(result$ as any);
    expect(result).toBeNull();
  });
});
