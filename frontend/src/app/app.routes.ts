import { Routes } from '@angular/router';
import { Layout } from './shared/components/layout/layout';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'auth/login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'auth/register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register/register').then((m) => m.Register),
      },
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'characters/link',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/character/character-link/character-link').then((m) => m.CharacterLink),
      },
      {
        path: 'characters/:id',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/character/character-detail/character-detail').then((m) => m.CharacterDetail),
      },
      {
        path: 'collections',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/collection/collection-tracker/collection-tracker').then((m) => m.CollectionTracker),
      },
      {
        path: 'fc',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/fc-dashboard/fc-overview/fc-overview').then((m) => m.FcOverview),
      },
      {
        path: 'fc/leaderboard',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/fc-dashboard/fc-leaderboard/fc-leaderboard').then((m) => m.FcLeaderboard),
      },
      {
        path: 'fc/almost-there',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/fc-dashboard/fc-almost-there/fc-almost-there').then((m) => m.FcAlmostThereComponent),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
