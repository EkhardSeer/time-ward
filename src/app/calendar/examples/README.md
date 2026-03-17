# Calendar Feature Demos

This folder contains standalone demo components, one per calendar feature. Each demo is intentionally minimal — showing only the specific feature it demonstrates with no surrounding noise.

All demos are wired into the app routing and accessible from the nav sidebar.

---

## Demo Catalog

| Route                  | Component                     | Feature                                                           |
| ---------------------- | ----------------------------- | ----------------------------------------------------------------- |
| `/demo/actions`        | `ActionsDemoComponent`        | Toolbar `[actions]` menu + `actionTriggered`                      |
| `/demo/multi-calendar` | `MultiCalendarDemoComponent`  | `[calendars]` with multiple `CalendarSource` objects              |
| `/demo/sidebar`        | `SidebarDemoComponent`        | Per-event `sidebarTemplate` — 3 distinct styles                   |
| `/demo/crud`           | `CrudDemoComponent`           | `eventAdded` / `eventUpdated` / `eventDeleted` in controlled mode |
| `/demo/config`         | `ConfigDemoComponent`         | Live playground for all boolean inputs + `rowHeight`              |
| `/demo/overflow`       | `OverflowDemoComponent`       | Month view "+N more" overflow on busy days                        |
| `/demo/builder`        | `BuilderDemoComponent`        | `buildCalendarEvents` utility — mapping API data to events        |
| `/demo/drag`           | `DragDemoComponent`           | Drag-to-create in week view                                       |
| `/production`          | `ProductionCalendarComponent` | Full production-style example with orders and shifts              |

---

## actions-demo

**Route:** `/demo/actions`

Demonstrates calendar-wide toolbar actions via `[actions]` and the `actionTriggered` output.

- Seeds the calendar with random meeting events for the current week.
- **Refresh** action regenerates a fresh set of random meetings.
- **Clear** action empties the event list.
- Sidebar is hidden (`[showSidebar]="false"`) to keep focus on the toolbar.

Key inputs/outputs shown: `[actions]`, `(actionTriggered)`, `[events]`, `[showSidebar]`

---

## multi-calendar-demo

**Route:** `/demo/multi-calendar`

Demonstrates the `[calendars]` input as a **shift planning board** — 5 staff members, each as an independent `CalendarSource` with their own colour. Toggle any person's chip in the toolbar to show or hide their schedule.

| Person      | Color       | Pattern                                |
| ----------- | ----------- | -------------------------------------- |
| Alice Chen  | Blue        | Day shifts Mon–Wed + Sat               |
| Ben Walsh   | Green       | Morning shifts Mon, Tue, Thu, Fri, Sun |
| Carol Park  | Purple      | Late shifts Tue–Sat                    |
| Dave Torres | Teal        | Day shifts Mon, Wed–Fri + short Sat    |
| Eva Müller  | Deep orange | Late shifts Mon–Tue + weekend coverage |

- All shifts are anchored to the current ISO week so the view lands on the right week automatically.
- `buildCalendarEvents` is used to map plain shift definitions into `CalendarEvent[]` for each source.

Key inputs shown: `[calendars]`, `CalendarSource`, `buildCalendarEvents`, `[rowHeight]`

---

## sidebar-demo

**Route:** `/demo/sidebar`

Demonstrates per-event `sidebarTemplate` by showing three entirely different sidebar layouts for three event types.

| Event type   | Sidebar style                                                             |
| ------------ | ------------------------------------------------------------------------- |
| **Meeting**  | Organizer, location, attendee chips, agenda summary, notes text area      |
| **Task**     | Priority badge, progress bar, checklist with completable items, tag chips |
| **Deadline** | Countdown box, inline **Mark Done** / **Snooze 1h** action buttons        |

- Each event has its own `sidebarTemplate` assigned in `ngAfterViewInit`.
- A calendar-wide **"Dismiss All Deadlines"** action greys out all deadline events.
- Demonstrates mixing `event.sidebarTemplate`, `event.actions`, and `[actions]` in one view.

Key inputs/outputs shown: `event.sidebarTemplate`, `event.actions`, `[actions]`, `(actionTriggered)`

---

## crud-demo

**Route:** `/demo/crud`

Demonstrates controlled mode — the parent component owns the event list and handles all mutations.

- Calendar operates in controlled mode via `[events]` + `(eventAdded/Updated/Deleted)`.
- A right-hand log panel records every mutation with a colored badge:
  - Green — `eventAdded`
  - Blue — `eventUpdated`
  - Red — `eventDeleted`
- Each log entry shows the event title, time range, and a timestamp.

Key inputs/outputs shown: `[events]`, `(eventAdded)`, `(eventUpdated)`, `(eventDeleted)`

---

## config-demo

**Route:** `/demo/config`

A live playground that lets you toggle every boolean input and adjust `rowHeight` in real time.

- **Toggles** (via `MatSlideToggle`): `readonly`, `showFab`, `showSidebar`, `showViewToggle`
- **Slider** (via `MatSlider`): `rowHeight` from 12 to 40 px, step 2
- **View buttons**: switch `initialView` between month / week / day
- A live **code preview** panel auto-generates the equivalent `<app-calendar>` binding — showing only non-default values.

Key inputs shown: `[readonly]`, `[showFab]`, `[showSidebar]`, `[showViewToggle]`, `[rowHeight]`, `[initialView]`

---

## overflow-demo

**Route:** `/demo/overflow`

Demonstrates the month view's "+N more" overflow behaviour when a day has more events than the grid can display.

- Renders in month view only (`[readonly]="true"`, `[showSidebar]="false"`).
- Most days have 0–2 events; 6 specific days are intentionally overloaded with 5–8 events to trigger overflow chips.

Key inputs shown: `[initialView]="'month'"`, `[readonly]`, `[showSidebar]`

---

## builder-demo

**Route:** `/demo/builder`

Demonstrates the `buildCalendarEvents` utility by transforming a raw API JSON payload into calendar events.

- The left panel shows a truncated preview of the raw `ApiBooking[]` JSON.
- `buildCalendarEvents` maps `bookingId → id`, `resource → title`, ISO string fields → `DateTime`.
- Color is derived per-item based on `category` (`room` = blue, `equipment` = orange, `vehicle` = green).
- The per-event sidebar template reads `event.data` typed as `ApiBooking` and renders room / equipment / vehicle icons.

Key feature shown: `buildCalendarEvents`, `BuildCalendarEventsOptions`, `event.data`, ISO string coercion

---

## drag-demo

**Route:** `/demo/drag`

Demonstrates the drag-to-create gesture in week view.

- Starts with an empty week (`[showFab]="false"`, `[showSidebar]="false"`, `[readonly]="false"`).
- A hint box explains the gesture: "Click & drag on an empty time slot to create an event."
- A right-hand log panel records every interaction — added, updated, and deleted — with type badges, event titles, time ranges, and timestamps.

Key inputs/outputs shown: `(eventAdded)`, `(eventUpdated)`, `(eventDeleted)`, `[initialView]="'week'"`

---

## production-calendar

**Route:** `/production`

A full production-style demo using two `CalendarSource` objects with real domain data.

- **Production Orders** (orange) — randomly scheduled manufacturing orders ±14 days from today.
- **Shifts** (blue) — recurring weekly shift blocks.
- Uses `buildCalendarEvents` for both sources.
- Each source has its own `sidebarTemplate` showing domain-specific details.
- A **Shuffle** toolbar action regenerates all production orders with new random dates.

Key features shown: `[calendars]`, `CalendarSource`, `buildCalendarEvents`, `event.sidebarTemplate`, `[actions]`
