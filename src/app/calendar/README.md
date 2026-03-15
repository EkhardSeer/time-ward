# Calendar Component

A full-featured Angular calendar component with month, week, and day views. Supports event creation, editing, deletion, multi-day spanning, overlap detection, drag-free time-slot clicking, sidebar details panel, custom templates, and full i18n.

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
