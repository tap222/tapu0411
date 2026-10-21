import { Routes } from '@angular/router';
import { homeGuard } from '../core/auth/guards/home.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    canActivate: [homeGuard],
    loadComponent: () => import('./login/login.component').then((m) => m.LoginPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
