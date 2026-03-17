# Calendar Component

A full-featured Angular calendar component with month, week, and day views. Supports event creation, editing, deletion, multi-day spanning, overlap detection, drag-free time-slot clicking, sidebar details panel, custom templates, multi-calendar sources, toolbar actions, and full i18n.

---

## Table of Contents

- [Basic Usage](#basic-usage)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [CalendarEvent Model](#calendarevent-model)
- [CalendarSource — Multi-Calendar](#calendarsource--multi-calendar)
- [CalendarAction — Toolbar Actions](#calendaraction--toolbar-actions)
- [buildCalendarEvents Utility](#buildcalendarevents-utility)
- [Views](#views)
- [Event Management](#event-management)
- [Sidebar & Templates](#sidebar--templates)
- [Row Height](#row-height)
- [Internationalization](#internationalization)
- [Architecture — Layout Engines](#architecture--layout-engines)
- [Color Picker](#color-picker)

---

## Basic Usage

**Standalone / self-managed events** — the component manages its own internal event state:

```html
<app-calendar />
```

**Controlled mode** — pass events in from outside and react to changes:

```html
<app-calendar
  [events]="myEvents"
  (eventAdded)="onAdd($event)"
  (eventUpdated)="onUpdate($event)"
  (eventDeleted)="onDelete($event)"
/>
```

```typescript
myEvents: CalendarEvent[] = [];

onAdd(event: CalendarEvent)    { this.myEvents = [...this.myEvents, event]; }
onUpdate(event: CalendarEvent) { this.myEvents = this.myEvents.map(e => e.id === event.id ? event : e); }
onDelete(id: string)           { this.myEvents = this.myEvents.filter(e => e.id !== id); }
```

---

## Inputs

| Input             | Type                                                | Default          | Description                                                                                                                                          |
| ----------------- | --------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `events`          | `CalendarEvent[] \| undefined`                      | `undefined`      | External event list. When provided the component operates in _controlled mode_ — all changes are emitted via outputs and must be applied externally. |
| `calendars`       | `CalendarSource[] \| undefined`                     | `undefined`      | Multiple named calendar sources with individual colors. Overrides `events` when provided. See [CalendarSource](#calendarsource--multi-calendar).     |
| `readonly`        | `boolean`                                           | `false`          | Disables all editing: hides the FAB, prevents dialog opening, and disables inline editing.                                                           |
| `showFab`         | `boolean`                                           | `true`           | Show or hide the floating action button for adding events.                                                                                           |
| `showSidebar`     | `boolean`                                           | `true`           | Show or hide the right-hand event details / inline edit panel.                                                                                       |
| `showViewToggle`  | `boolean`                                           | `true`           | Show or hide the Month / Week / Day view switcher in the toolbar.                                                                                    |
| `initialView`     | `'month' \| 'week' \| 'day'`                        | `'month'`        | The view to display on first render.                                                                                                                 |
| `initialDate`     | `DateTime`                                          | `DateTime.now()` | The date to navigate to on first render (Luxon `DateTime`).                                                                                          |
| `rowHeight`       | `number`                                            | `20`             | Height in pixels of each 15-minute row in week/day views. See [Row Height](#row-height).                                                             |
| `actions`         | `CalendarAction[]`                                  | `[]`             | Toolbar action buttons rendered as a menu in the top-right corner. See [CalendarAction](#calendaraction--toolbar-actions).                           |
| `detailsTemplate` | `TemplateRef<{ $implicit: CalendarEvent }> \| null` | `null`           | Global custom template rendered in the sidebar for every selected event. Overridden by a per-event `sidebarTemplate`.                                |

---

## Outputs

| Output            | Payload             | Fired When                                                       |
| ----------------- | ------------------- | ---------------------------------------------------------------- |
| `eventAdded`      | `CalendarEvent`     | User saves a new event via the add dialog or FAB.                |
| `eventUpdated`    | `CalendarEvent`     | User saves changes to an existing event (inline edit or dialog). |
| `eventDeleted`    | `string` (event ID) | User deletes an event via inline panel or dialog.                |
| `eventSelected`   | `CalendarEvent`     | User clicks an event on the calendar grid.                       |
| `actionTriggered` | `CalendarAction`    | User clicks an item in the toolbar actions menu.                 |

---

## CalendarEvent Model

```typescript
import { DateTime } from 'luxon';
import { TemplateRef } from '@angular/core';

interface CalendarEvent {
  id: string; // Unique identifier (UUID)
  title: string; // Display title
  start: DateTime; // Event start (Luxon DateTime)
  end: DateTime; // Event end (Luxon DateTime)
  color: string; // Hex color string, e.g. '#1976d2'
  data?: unknown; // Optional arbitrary domain payload
  sidebarTemplate?: TemplateRef<{ $implicit: CalendarEvent }> | null; // Per-event sidebar template
  actions?: CalendarAction[]; // Per-event action buttons in the sidebar
}
```

Creating an event manually:

```typescript
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';

const event: CalendarEvent = {
  id: uuid(),
  title: 'Team Standup',
  start: DateTime.now().set({ hour: 9, minute: 0, second: 0, millisecond: 0 }),
  end: DateTime.now().set({ hour: 9, minute: 30, second: 0, millisecond: 0 }),
  color: '#1976d2',
};
```

---

## CalendarSource — Multi-Calendar

`CalendarSource` groups events under a named calendar with a shared color. Use `[calendars]` instead of `[events]` when you have multiple distinct calendars (e.g. Work, Personal, Holidays).

```typescript
interface CalendarSource {
  id: string; // Unique calendar identifier
  name: string; // Display name shown in the toolbar
  color: string; // Default hex color for all events in this source
  events: CalendarEvent[];
}
```

### Example

```typescript
import { CalendarSource, buildCalendarEvents } from './calendar';

calendars: CalendarSource[] = [
  {
    id: 'work',
    name: 'Work',
    color: '#1565c0',
    events: buildCalendarEvents(workItems, 'id', 'title', 'startDate', 'endDate'),
  },
  {
    id: 'personal',
    name: 'Personal',
    color: '#2e7d32',
    events: buildCalendarEvents(personalItems, 'id', 'summary', 'from', 'to'),
  },
];
```

```html
<app-calendar [calendars]="calendars" />
```

The toolbar renders a chip for each source. Clicking a chip toggles that calendar's visibility.

---

## CalendarAction — Toolbar Actions

`CalendarAction` defines a button in the toolbar's action menu (accessible via the `⋮` icon). Actions can be calendar-wide (via `[actions]`) or per-event (via `event.actions`).

```typescript
interface CalendarAction {
  id: string; // Unique identifier for the action
  label: string; // Display text in the menu
  icon?: string; // Optional Material icon name (e.g. 'refresh', 'delete')
}
```

### Calendar-wide actions

```typescript
actions: CalendarAction[] = [
  { id: 'refresh', label: 'Refresh', icon: 'refresh' },
  { id: 'clear',   label: 'Clear All', icon: 'delete_sweep' },
];

onAction(action: CalendarAction) {
  if (action.id === 'refresh') { /* ... */ }
  if (action.id === 'clear')   { /* ... */ }
}
```

```html
<app-calendar [actions]="actions" (actionTriggered)="onAction($event)" />
```

### Per-event actions

Attach `actions` directly to individual `CalendarEvent` objects. They appear as buttons in the sidebar when that event is selected:

```typescript
const event: CalendarEvent = {
  id: uuid(),
  title: 'Sprint Planning',
  // ...
  actions: [
    { id: 'mark-done', label: 'Mark Done', icon: 'check_circle' },
    { id: 'snooze', label: 'Snooze 1h', icon: 'snooze' },
  ],
};
```

The `actionTriggered` output fires with the `CalendarAction` for both calendar-wide and per-event actions.

---

## buildCalendarEvents Utility

`buildCalendarEvents` maps an array of arbitrary domain objects into `CalendarEvent[]`. It handles ISO string → `DateTime` coercion automatically, so you can pass raw API responses directly.

### Signature

```typescript
function buildCalendarEvents<T extends object>(
  items: T[],
  idField: keyof T,
  titleField: keyof T,
  startField: keyof T,
  endField: keyof T,
  options?: BuildCalendarEventsOptions<T>,
): CalendarEvent[];
```

### `BuildCalendarEventsOptions`

```typescript
interface BuildCalendarEventsOptions<T> {
  color?: string | ((item: T) => string); // Static color or per-item color fn
  sidebarTemplate?: TemplateRef<{ $implicit: CalendarEvent }> | null; // Template for all events from this source
  actions?: CalendarAction[]; // Actions for all events from this source
}
```

### Example — mapping an API response

```typescript
interface ApiBooking {
  bookingId: string;
  resource: string;
  startIso: string; // ISO 8601 string — automatically coerced to DateTime
  endIso: string;
  category: 'room' | 'equipment';
}

const events = buildCalendarEvents(apiResponse, 'bookingId', 'resource', 'startIso', 'endIso', {
  color: (item) => (item.category === 'room' ? '#1565c0' : '#e65100'),
  sidebarTemplate: this.bookingTemplate,
});
```

The `data` field of each produced `CalendarEvent` holds the original domain object, accessible in sidebar templates as `event.data`.

---

## Views

| View    | Description                                                                                  |
| ------- | -------------------------------------------------------------------------------------------- |
| `month` | Full-month grid. Overlapping events stack with "+N more" overflow chips for busy days.       |
| `week`  | 7-column time grid (00:00–24:00). Overlapping events are placed side-by-side in sub-columns. |
| `day`   | Single-column time grid. Same overlap detection as the week view.                            |

Switch view programmatically via `[initialView]`, or let the user toggle with the toolbar view selector (hidden with `[showViewToggle]="false"`).

---

## Event Management

### Self-managed mode (default)

When no `[events]` or `[calendars]` binding is present, the component owns its event list internally. Adds, edits, and deletes are applied automatically with no external state needed:

```html
<app-calendar />
```

### Controlled mode

Bind `[events]` to take ownership of state. Every mutation is emitted as an output — you must update your state array to reflect the change:

```typescript
myEvents = signal<CalendarEvent[]>([]);

onAdd(ev: CalendarEvent)    { this.myEvents.update(es => [...es, ev]); }
onUpdate(ev: CalendarEvent) { this.myEvents.update(es => es.map(e => e.id === ev.id ? ev : e)); }
onDelete(id: string)        { this.myEvents.update(es => es.filter(e => e.id !== id)); }
```

```html
<app-calendar
  [events]="myEvents()"
  (eventAdded)="onAdd($event)"
  (eventUpdated)="onUpdate($event)"
  (eventDeleted)="onDelete($event)"
/>
```

### Read-only mode

Set `[readonly]="true"` to prevent any edits. The FAB and inline-edit controls are hidden. Events are still clickable and the sidebar opens for viewing:

```html
<app-calendar [events]="myEvents" [readonly]="true" />
```

---

## Sidebar & Templates

The sidebar opens when the user selects an event. By default it renders an editable event detail form. You can replace it with a custom template.

### Global custom template

`[detailsTemplate]` applies to every event:

```html
<app-calendar [events]="myEvents" [detailsTemplate]="myTemplate" />

<ng-template #myTemplate let-event>
  <h3>{{ event.title }}</h3>
  <p>{{ event.start.toFormat('HH:mm') }} – {{ event.end.toFormat('HH:mm') }}</p>
</ng-template>
```

### Per-event `sidebarTemplate`

Assign a different template to individual events. A per-event template takes priority over `[detailsTemplate]`:

```typescript
// In ngAfterViewInit — attach template references to specific events
@ViewChild('meetingTpl') meetingTpl!: TemplateRef<any>;
@ViewChild('taskTpl') taskTpl!: TemplateRef<any>;

ngAfterViewInit() {
  this.meetingEvents = this.meetingEvents.map(e => ({ ...e, sidebarTemplate: this.meetingTpl }));
  this.taskEvents    = this.taskEvents.map(e    => ({ ...e, sidebarTemplate: this.taskTpl }));
}
```

```html
<ng-template #meetingTpl let-event>
  <strong>Organizer:</strong> {{ event.data.organizer }}<br />
  <strong>Location:</strong> {{ event.data.location }}
</ng-template>

<ng-template #taskTpl let-event>
  <mat-progress-bar [value]="event.data.progress" />
</ng-template>
```

---

## Row Height

The `rowHeight` input controls the pixel height of each 15-minute slot in week and day views. Increasing it zooms in, revealing more time detail. The value is also written as a CSS custom property (`--row-height`) on the component host.

| `rowHeight` | Time visible without scrolling |
| ----------- | ------------------------------ |
| `12` (min)  | ~8 hours                       |
| `20` (def)  | ~5 hours                       |
| `40` (max)  | ~2.5 hours                     |

```html
<app-calendar [rowHeight]="28" />
```

---

## Internationalization

Provide a `CALENDAR_I18N` token to override any display string. Both English and German bundles are included:

```typescript
import { CALENDAR_I18N, CALENDAR_I18N_EN, CALENDAR_I18N_DE } from './calendar';

// Use the built-in German bundle
providers: [{ provide: CALENDAR_I18N, useValue: CALENDAR_I18N_DE }];
```

### Custom bundle

```typescript
import { CalendarI18n, CALENDAR_I18N } from './calendar';

const MY_I18N: CalendarI18n = {
  ...CALENDAR_I18N_EN, // start from English defaults
  btnSave: 'Confirm',
  btnDelete: 'Remove',
};

providers: [{ provide: CALENDAR_I18N, useValue: MY_I18N }];
```

### All i18n keys

| Key                | Default (EN) | Description                       |
| ------------------ | ------------ | --------------------------------- |
| `viewMonth`        | `Month`      | Toolbar view selector option      |
| `viewWeek`         | `Week`       | Toolbar view selector option      |
| `viewDay`          | `Day`        | Toolbar view selector option      |
| `dialogTitleAdd`   | `Add Event`  | Add dialog title                  |
| `dialogTitleEdit`  | `Edit Event` | Edit dialog title                 |
| `fieldTitle`       | `Title`      | Event title field label           |
| `fieldColor`       | `Color`      | Color picker field label          |
| `fieldStartDate`   | `Start Date` | Start date field label            |
| `fieldStartTime`   | `Start Time` | Start time field label            |
| `fieldEndDate`     | `End Date`   | End date field label              |
| `fieldEndTime`     | `End Time`   | End time field label              |
| `fieldDuration`    | `Duration`   | Duration display label            |
| `dateHint`         | `MM/DD/YYYY` | Datepicker input hint             |
| `datepickerCancel` | `Cancel`     | Datepicker cancel button          |
| `datepickerApply`  | `Apply`      | Datepicker apply button           |
| `btnDelete`        | `Delete`     | Delete button in dialog / sidebar |
| `btnCancel`        | `Cancel`     | Cancel button in dialog           |
| `btnSave`          | `Save`       | Save button in dialog             |

---

## Architecture — Layout Engines

The calendar uses three **pure layout engines** (no Angular dependency) that convert `CalendarEvent[]` into `PositionedEvent[]` with CSS positioning data:

| Class                 | View  | Key method      | Grid                                       |
| --------------------- | ----- | --------------- | ------------------------------------------ |
| `CalendarDayLayout`   | Day   | `layoutDay()`   | 1 column × 96 rows (15-min slots)          |
| `CalendarWeekLayout`  | Week  | `layoutWeek()`  | 7 columns × 96 rows (15-min slots)         |
| `CalendarMonthLayout` | Month | `layoutMonth()` | 7 columns × N week-rows (max 4 events/day) |

All three extend `CalendarLayoutBase`, which provides:

- **Grid constants** — `MAX_ROWS` (96), `ROWS_PER_HOUR` (4)
- **Builder helpers** — `buildPositionLayout()`, `buildSizing()`, `buildViewMetadata()`
- **Column assignment** — `assignColumns()` — greedy algorithm that places overlapping events side-by-side in sub-columns
- **Row math** — `timeToRow()`, `durationToRowSpan()`

All layout classes are re-exported from `calendar-layout.ts` for unified access.

---

## Color Picker

The `ColorPickerComponent` is used internally in the add/edit dialog and inline sidebar editor, but can also be used standalone:

```html
<app-color-picker [(color)]="selectedColor" [label]="'Color'" />
```

| Input          | Type             | Default         | Description                                           |
| -------------- | ---------------- | --------------- | ----------------------------------------------------- |
| `color`        | `string` (model) | —               | Two-way bound hex color value.                        |
| `label`        | `string`         | —               | Optional label displayed to the left of the swatches. |
| `presetColors` | `string[]`       | Default palette | Array of hex strings for the preset swatch row.       |

Default palette: `#1976d2`, `#0097a7`, `#388e3c`, `#f57c00`, `#d32f2f`, `#7b1fa2`, `#fbc02d`, `#455a64`

A **custom color** button opens the native browser color picker for any hex value beyond the presets.

---

## Table of Contents

- [Basic Usage](#basic-usage)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [CalendarEvent Model](#calendarevent-model)
- [Views](#views)
- [Event Management](#event-management)
- [Sidebar & Templates](#sidebar--templates)
- [Internationalization](#internationalization)
- [Color Picker](#color-picker)

---

## Basic Usage

**Standalone / self-managed events** — the component manages its own internal event state:

```html
<app-calendar />
```

**Controlled mode** — pass events in from outside and react to changes:

```html
<app-calendar
  [events]="myEvents"
  (eventAdded)="onAdd($event)"
  (eventUpdated)="onUpdate($event)"
  (eventDeleted)="onDelete($event)"
/>
```

```typescript
myEvents: CalendarEvent[] = [];

onAdd(event: CalendarEvent)    { this.myEvents = [...this.myEvents, event]; }
onUpdate(event: CalendarEvent) { this.myEvents = this.myEvents.map(e => e.id === event.id ? event : e); }
onDelete(id: string)           { this.myEvents = this.myEvents.filter(e => e.id !== id); }
```

---

## Inputs

| Input             | Type                                                | Default          | Description                                                                                                                                          |
| ----------------- | --------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `events`          | `CalendarEvent[] \| undefined`                      | `undefined`      | External event list. When provided the component operates in _controlled mode_ — all changes are emitted via outputs and must be applied externally. |
| `readonly`        | `boolean`                                           | `false`          | Disables all editing: hides the FAB, prevents dialog opening, and disables inline editing.                                                           |
| `showFab`         | `boolean`                                           | `true`           | Show or hide the floating action button for adding events.                                                                                           |
| `showSidebar`     | `boolean`                                           | `true`           | Show or hide the right-hand event details / inline edit panel.                                                                                       |
| `showViewToggle`  | `boolean`                                           | `true`           | Show or hide the Month / Week / Day view switcher.                                                                                                   |
| `initialView`     | `'month' \| 'week' \| 'day'`                        | `'month'`        | The view to display on first render.                                                                                                                 |
| `initialDate`     | `DateTime`                                          | `DateTime.now()` | The date to navigate to on first render (Luxon `DateTime`).                                                                                          |
| `detailsTemplate` | `TemplateRef<{ $implicit: CalendarEvent }> \| null` | `null`           | Custom template rendered in the sidebar when an event is selected. The selected event is passed as the implicit template context variable.           |

---

## Outputs

| Output          | Payload             | Fired When                                                       |
| --------------- | ------------------- | ---------------------------------------------------------------- |
| `eventAdded`    | `CalendarEvent`     | User saves a new event via the add dialog or FAB.                |
| `eventUpdated`  | `CalendarEvent`     | User saves changes to an existing event (inline edit or dialog). |
| `eventDeleted`  | `string` (event ID) | User deletes an event via inline panel or dialog.                |
| `eventSelected` | `CalendarEvent`     | User clicks an event on the calendar grid.                       |

---

## CalendarEvent Model

```typescript
import { DateTime } from 'luxon';

interface CalendarEvent {
  id: string; // Unique identifier (UUID)
  title: string; // Display title
  start: DateTime; // Event start (Luxon DateTime)
  end: DateTime; // Event end (Luxon DateTime)
  color: string; // Hex color string, e.g. '#1976d2'
  data?: unknown; // Optional arbitrary domain payload
}
```

Creating an event manually:

```typescript
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';

const event: CalendarEvent = {
  id: uuid(),
  title: 'Team Standup',
  start: DateTime.now().set({ hour: 9, minute: 0, second: 0, millisecond: 0 }),
  end: DateTime.now().set({ hour: 9, minute: 30, second: 0, millisecond: 0 }),
  color: '#1976d2',
};
```

---

## Views

### Month View

- Grid of weeks, each row representing one week.
- Multi-day and multi-week events span across day cells.
- Up to **3 events** are rendered per day; additional events are collapsed into a **"+N more"** indicator.

### Week View

- 7-day column grid with a **24-hour timeline** (15-minute interval slots).
- Events are sized proportionally to their duration.
- Overlapping events are placed **side by side** in sub-columns.
- Hover over a time slot to set the pre-filled start time for a new event.

### Day View

- Single-day timeline with the same 24-hour / 15-minute grid as the week view.
- Overlapping events appear side by side at full column width.

---

## Event Management

### Adding Events

- Click the **FAB** (bottom-right) to open the add dialog with the current time pre-filled.
- Click an **empty time slot** in week or day view to open the add dialog with that slot's time pre-filled.
- Click an **empty day cell** in month view to open the add dialog for that date.

### Editing Events

- Click any event to select it and open the **sidebar inline editor** (title, times, color).
- Changes are saved with the **Save** button or discarded with **Cancel**.
- Changing the start time automatically adjusts the end time to preserve the original duration.

### Deleting Events

- Click **Delete** in the inline sidebar editor.
- Click the event to open the edit dialog, then click **Delete** in the dialog.

---

## Sidebar & Templates

The sidebar opens on the right when an event is selected. By default it renders the built-in inline edit form.

To replace it with a custom read-only (or fully custom) view, pass a `detailsTemplate`:

```html
<app-calendar [events]="events" [detailsTemplate]="myDetails" />

<ng-template #myDetails let-event>
  <h3>{{ event.title }}</h3>
  <p>{{ event.start.toFormat('HH:mm') }} – {{ event.end.toFormat('HH:mm') }}</p>
</ng-template>
```

Hide the sidebar entirely with `[showSidebar]="false"` — useful when `eventSelected` is used to open a custom modal instead.

---

## Internationalization

The calendar uses an `InjectionToken` called `CALENDAR_I18N` for all UI labels. The default locale is **German** (`DE_CALENDAR_I18N`). Switch to English (or any custom locale) by providing a value in your `app.config.ts`:

```typescript
import { CALENDAR_I18N, EN_CALENDAR_I18N } from './calendar/calendar-i18n';

export const appConfig: ApplicationConfig = {
  providers: [{ provide: CALENDAR_I18N, useValue: EN_CALENDAR_I18N }],
};
```

To create a custom locale, implement the `CalendarI18n` interface:

```typescript
import { CalendarI18n, CALENDAR_I18N } from './calendar/calendar-i18n';

const MY_I18N: CalendarI18n = {
  viewMonth: 'Month',
  viewWeek: 'Week',
  viewDay: 'Day',
  weekPrefix: 'W',
  locale: 'en',
  weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  dialogAddTitle: 'New Event',
  dialogEditTitle: 'Edit Event',
  fieldTitle: 'Title',
  fieldColor: 'Color',
  fieldStartDate: 'Start Date',
  fieldStartTime: 'Start Time',
  fieldEndDate: 'End Date',
  fieldEndTime: 'End Time',
  fieldDuration: 'Duration',
  dateHint: 'MM/DD/YYYY',
  datepickerCancel: 'Cancel',
  datepickerApply: 'Apply',
  btnDelete: 'Delete',
  btnCancel: 'Cancel',
  btnSave: 'Save',
};

providers: [{ provide: CALENDAR_I18N, useValue: MY_I18N }];
```

---

## Architecture — Layout Engines

The calendar uses three **pure layout engines** (no Angular dependency) that convert `CalendarEvent[]` into `PositionedEvent[]` with CSS positioning data:

| Class                 | View  | Key method      | Grid                                       |
| --------------------- | ----- | --------------- | ------------------------------------------ |
| `CalendarDayLayout`   | Day   | `layoutDay()`   | 1 column × 96 rows (15-min slots)          |
| `CalendarWeekLayout`  | Week  | `layoutWeek()`  | 7 columns × 96 rows (15-min slots)         |
| `CalendarMonthLayout` | Month | `layoutMonth()` | 7 columns × N week-rows (max 4 events/day) |

All three extend `CalendarLayoutBase`, which provides:

- **Grid constants** — `MAX_ROWS` (96), `ROWS_PER_HOUR` (4)
- **Builder helpers** — `buildPositionLayout()`, `buildSizing()`, `buildViewMetadata()`
- **Column assignment** — `assignColumns()` — greedy algorithm that places overlapping events side-by-side in sub-columns
- **Row math** — `timeToRow()`, `durationToRowSpan()`

All layout classes are re-exported from `calendar-layout.ts` for unified access.

---

## Color Picker

The `ColorPickerComponent` is used internally in the add/edit dialog and inline sidebar editor, but can also be used standalone:

```html
<app-color-picker [(color)]="selectedColor" [label]="'Color'" />
```

| Input          | Type             | Default         | Description                                           |
| -------------- | ---------------- | --------------- | ----------------------------------------------------- |
| `color`        | `string` (model) | —               | Two-way bound hex color value.                        |
| `label`        | `string`         | —               | Optional label displayed to the left of the swatches. |
| `presetColors` | `string[]`       | Default palette | Array of hex strings for the preset swatch row.       |

Default palette: `#1976d2`, `#0097a7`, `#388e3c`, `#f57c00`, `#d32f2f`, `#7b1fa2`, `#fbc02d`, `#455a64`

A **custom color** button opens the native browser color picker for any hex value beyond the presets.
