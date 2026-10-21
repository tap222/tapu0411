import { Routes } from '@angular/router';
import { authGuard } from '../core/auth/guards/auth.guard';

export const teamsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/team-list/team-list.component').then((m) => m.TeamListComponent),
  },
  {
    path: 'new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/team-builder/team-builder.component').then((m) => m.TeamBuilderComponent),
  },
];
