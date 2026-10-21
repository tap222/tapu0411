import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard redirecting authenticated users away from auth pages to /pokedex.
 */
export const homeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isSignedIn()) {
    return router.createUrlTree(['/pokedex']);
  }

  return true;
};
