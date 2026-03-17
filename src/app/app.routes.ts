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
    path: 'demo/crud',
    loadComponent: () =>
      import('./calendar/examples/crud-demo/crud-demo.component').then((m) => m.CrudDemoComponent),
  },
  {
    path: 'demo/config',
    loadComponent: () =>
      import('./calendar/examples/config-demo/config-demo.component').then(
        (m) => m.ConfigDemoComponent,
      ),
  },
  {
    path: 'demo/overflow',
    loadComponent: () =>
      import('./calendar/examples/overflow-demo/overflow-demo.component').then(
        (m) => m.OverflowDemoComponent,
      ),
  },
  {
    path: 'demo/builder',
    loadComponent: () =>
      import('./calendar/examples/builder-demo/builder-demo.component').then(
        (m) => m.BuilderDemoComponent,
      ),
  },
  {
    path: 'demo/drag',
    loadComponent: () =>
      import('./calendar/examples/drag-demo/drag-demo.component').then((m) => m.DragDemoComponent),
  },
  {
    path: 'production',
    loadComponent: () =>
      import('./calendar/examples/production-calendar/production-calendar.component').then(
        (m) => m.ProductionCalendarComponent,
      ),
  },
];
