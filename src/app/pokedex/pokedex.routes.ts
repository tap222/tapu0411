import { Routes } from '@angular/router';

export const pokedexRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/pokemon-table/pokemon-table.component').then((m) => m.PokemonTableComponent),
  },
];
