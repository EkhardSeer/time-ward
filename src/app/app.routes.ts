import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./calendar/calendar.component').then((m) => m.CalendarComponent),
  },
  {
    path: 'production',
    loadComponent: () =>
      import('./production-calendar/production-calendar.component').then(
        (m) => m.ProductionCalendarComponent,
      ),
  },
];
