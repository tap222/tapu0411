import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, catchError, delay, map, of, switchMap, timer } from 'rxjs';
import { TeamStore } from '../state/team.store';

/**
 * Creates an asynchronous validator checking for team name uniqueness.
 * Features a 300ms debounce to prevent excessive validation checks.
 *
 * @param teamStore Custom team store instance
 */
export function uniqueTeamNameValidator(teamStore: TeamStore): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const rawVal = control.value;
    if (!rawVal || typeof rawVal !== 'string') {
      return of(null);
    }

    const trimmed = rawVal.trim().toLowerCase();
    if (trimmed.length < 3) {
      return of(null);
    }

    // Debounce validation by 300ms
    return timer(300).pipe(
      switchMap(() => {
        const existingTeams = teamStore.snapshot.teams;
        const isDuplicate = existingTeams.some((team) => team.name.trim().toLowerCase() === trimmed);

        if (isDuplicate) {
          return of({ teamNameTaken: true });
        }
        return of(null);
      }),
      catchError(() => of(null)),
    );
  };
}
