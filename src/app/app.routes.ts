import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./app.component').then(c => c.MainComponent)
  },
  {
    path: 'stream',
    loadComponent: () => import('./components/stream-dashboard/stream-dashboard.component').then(c => c.StreamDashboardComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];