# Time Ward

An Angular application built around a full-featured calendar component. Supports month, week, and day views with event creation, editing, deletion, multi-day spanning, overlap detection, sidebar details panel, custom templates, and full i18n.

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
    ├── calendar/               # Calendar component & supporting files
    │   ├── calendar.component.ts
    │   ├── calendar-event.ts   # CalendarEvent model
    │   ├── calendar-i18n.ts    # i18n tokens (DE + EN included)
    │   ├── calendar-layout.ts
    │   ├── calendar-month-layout.ts
    │   ├── calendar-week-layout.ts
    │   ├── calendar-day-layout.ts
    │   ├── add-edit-event-dialog.component.ts
    │   ├── color-picker.component.ts
    │   ├── event-time-range.component.ts
    │   └── README.md           # Calendar component usage docs
    └── production-calendar/    # Production usage example
```

---

## Calendar Component

The core of the app is the `<app-calendar>` component. See [src/app/calendar/README.md](src/app/calendar/README.md) for full usage documentation including:

- Inputs & outputs reference
- Controlled vs. self-managed event mode
- Month, week, and day view details
- Custom sidebar templates
- Internationalization (i18n)
- Standalone `ColorPickerComponent` usage

Quick example:

```html
<app-calendar
  [events]="myEvents"
  [initialView]="'week'"
  (eventAdded)="onAdd($event)"
  (eventUpdated)="onUpdate($event)"
  (eventDeleted)="onDelete($event)"
/>
```

---

## Additional Resources

- [Angular CLI Reference](https://angular.dev/tools/cli)
- [Luxon Documentation](https://moment.github.io/luxon/)
