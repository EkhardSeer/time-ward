# Time Ward

An Angular application built around a full-featured calendar component. Supports month, week, and day views with event creation, editing, deletion, multi-day spanning, overlap detection, sidebar details panel, custom templates, multi-calendar sources, toolbar actions, and full i18n.

Built with [Angular](https://angular.dev) v21 and [Luxon](https://moment.github.io/luxon/) for date handling.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Angular CLI](https://angular.dev/tools/cli) v21+

### Install dependencies

```bash
npm install
```

### Development server

```bash
ng serve
```

Open your browser at `http://localhost:4200/`. The app reloads automatically on file changes.

### Production build

```bash
ng build
```

Build artifacts are written to the `dist/` directory, optimized for performance.

---

## Testing

Run unit tests with [Vitest](https://vitest.dev/):

```bash
ng test
```

---

## Project Structure

```
src/
└── app/
    ├── calendar/
    │   ├── calendar.component.ts/html/scss   # Core calendar component
    │   ├── index.ts                          # Public API re-exports
    │   ├── README.md                         # Full component usage docs
    │   ├── components/                       # Internal sub-components
    │   │   ├── add-edit-event-dialog.component.ts
    │   │   ├── color-picker.component.ts
    │   │   └── event-time-range.component.ts
    │   ├── layout/                           # Pure layout engine classes
    │   │   ├── calendar-layout-base.ts
    │   │   ├── calendar-day-layout.ts
    │   │   ├── calendar-week-layout.ts
    │   │   └── calendar-month-layout.ts
    │   ├── models/                           # Data models & interfaces
    │   │   ├── calendar-event.ts
    │   │   ├── calendar-action.ts
    │   │   └── calendar-source.ts
    │   ├── utils/                            # Utility functions
    │   │   └── build-calendar-events.ts      # buildCalendarEvents helper
    │   ├── testing/                          # Test helpers & mocks
    │   └── examples/                         # Feature demo components
    │       ├── actions-demo/
    │       ├── builder-demo/
    │       ├── config-demo/
    │       ├── crud-demo/
    │       ├── drag-demo/
    │       ├── multi-calendar-demo/
    │       ├── overflow-demo/
    │       ├── sidebar-demo/
    │       ├── production-calendar/
    │       └── README.md                     # Demo catalog
    └── app.routes.ts / app.html / app.scss
```

---

## Demos

Live feature demonstrations are available in the running app:

| Route                  | What it shows                                                             |
| ---------------------- | ------------------------------------------------------------------------- |
| `/`                    | Default self-managed calendar                                             |
| `/demo/actions`        | Toolbar `[actions]` menu + `actionTriggered` output                       |
| `/demo/multi-calendar` | `[calendars]` with multiple `CalendarSource` objects                      |
| `/demo/sidebar`        | Per-event `sidebarTemplate` — 3 distinct sidebar styles                   |
| `/demo/crud`           | `eventAdded` / `eventUpdated` / `eventDeleted` outputs in controlled mode |
| `/demo/config`         | Live playground for all boolean inputs and `rowHeight`                    |
| `/demo/overflow`       | Month view "+N more" overflow with busy days                              |
| `/demo/builder`        | `buildCalendarEvents` utility — mapping API data to events                |
| `/demo/drag`           | Drag-to-create in week view                                               |
| `/production`          | Production-style example with orders and shift data                       |

See [src/app/calendar/examples/README.md](src/app/calendar/examples/README.md) for details on each demo.

---

## Calendar Component

The core of the app is the `<app-calendar>` component. See [src/app/calendar/README.md](src/app/calendar/README.md) for full usage documentation including:

- Inputs & outputs reference
- Controlled vs. self-managed event mode
- Multi-calendar sources (`CalendarSource`)
- Toolbar actions (`CalendarAction`)
- `buildCalendarEvents` utility
- Month, week, and day view details
- Custom sidebar templates (global and per-event)
- Row height configuration
- Internationalization (i18n)
- Standalone `ColorPickerComponent` usage

Quick example:

```html
<app-calendar
  [events]="myEvents"
  [initialView]="'week'"
  [actions]="toolbarActions"
  (eventAdded)="onAdd($event)"
  (eventUpdated)="onUpdate($event)"
  (eventDeleted)="onDelete($event)"
  (actionTriggered)="onAction($event)"
/>
```

---

## Additional Resources

- [Angular CLI Reference](https://angular.dev/tools/cli)
- [Luxon Documentation](https://moment.github.io/luxon/)
