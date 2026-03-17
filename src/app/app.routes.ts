import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./calendar/calendar.component').then((m) => m.CalendarComponent),
  },
  {
    path: 'demo/actions',
    loadComponent: () =>
      import('./calendar/examples/actions-demo/actions-demo.component').then(
        (m) => m.ActionsDemoComponent,
      ),
  },
  {
    path: 'demo/multi-calendar',
    loadComponent: () =>
      import('./calendar/examples/multi-calendar-demo/multi-calendar-demo.component').then(
        (m) => m.MultiCalendarDemoComponent,
      ),
  },
  {
    path: 'demo/sidebar',
    loadComponent: () =>
      import('./calendar/examples/sidebar-demo/sidebar-demo.component').then(
        (m) => m.SidebarDemoComponent,
      ),
  },
  {
    path: 'production',
    loadComponent: () =>
      import('./calendar/examples/production-calendar/production-calendar.component').then(
        (m) => m.ProductionCalendarComponent,
      ),
  },
];
