import { Component, signal } from '@angular/core';
import { DateTime } from 'luxon';
import { CalendarComponent } from '../../calendar.component';
import { CalendarSource } from '../../models/calendar-source';
import { buildCalendarEvents } from '../../utils/build-calendar-events';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Monday of the current ISO week. */
const WEEK_START = DateTime.now().startOf('week');

interface ShiftDef {
  day: number; // 0 = Mon … 6 = Sun
  start: number; // hour (24h)
  end: number;
  label: string;
}

function buildShifts(personId: string, shifts: ShiftDef[], color: string) {
  return buildCalendarEvents(
    shifts.map(({ day, start, end, label }) => ({
      id: `${personId}-${day}`,
      title: label,
      start: WEEK_START.plus({ days: day }).set({ hour: start, minute: 0, second: 0 }),
      end: WEEK_START.plus({ days: day }).set({ hour: end, minute: 0, second: 0 }),
    })),
    'id',
    'title',
    'start',
    'end',
    { color },
  );
}

// ── Staff schedules ───────────────────────────────────────────────────────────

// Alice Chen — day shifts Mon–Wed + Saturday
const aliceShifts = buildShifts(
  'alice',
  [
    { day: 0, start: 9, end: 17, label: 'Day Shift' },
    { day: 1, start: 9, end: 17, label: 'Day Shift' },
    { day: 2, start: 9, end: 17, label: 'Day Shift' },
    { day: 5, start: 10, end: 18, label: 'Day Shift' },
  ],
  '#1565c0',
);

// Ben Walsh — morning shifts Mon, Tue, Thu, Fri, Sun
const benShifts = buildShifts(
  'ben',
  [
    { day: 0, start: 6, end: 14, label: 'Morning Shift' },
    { day: 1, start: 6, end: 14, label: 'Morning Shift' },
    { day: 3, start: 6, end: 14, label: 'Morning Shift' },
    { day: 4, start: 6, end: 14, label: 'Morning Shift' },
    { day: 6, start: 6, end: 14, label: 'Morning Shift' },
  ],
  '#2e7d32',
);

// Carol Park — late shifts Tue–Fri + Saturday
const carolShifts = buildShifts(
  'carol',
  [
    { day: 1, start: 14, end: 22, label: 'Late Shift' },
    { day: 2, start: 14, end: 22, label: 'Late Shift' },
    { day: 3, start: 14, end: 22, label: 'Late Shift' },
    { day: 4, start: 14, end: 22, label: 'Late Shift' },
    { day: 5, start: 14, end: 22, label: 'Late Shift' },
  ],
  '#6a1b9a',
);

// Dave Torres — day shifts Mon, Wed–Fri + short Saturday
const daveShifts = buildShifts(
  'dave',
  [
    { day: 0, start: 9, end: 17, label: 'Day Shift' },
    { day: 2, start: 9, end: 17, label: 'Day Shift' },
    { day: 3, start: 9, end: 17, label: 'Day Shift' },
    { day: 4, start: 9, end: 17, label: 'Day Shift' },
    { day: 5, start: 9, end: 15, label: 'Short Shift' },
  ],
  '#00695c',
);

// Eva Müller — late shifts Mon–Tue + weekend coverage
const evaShifts = buildShifts(
  'eva',
  [
    { day: 0, start: 14, end: 22, label: 'Late Shift' },
    { day: 1, start: 14, end: 22, label: 'Late Shift' },
    { day: 4, start: 14, end: 22, label: 'Late Shift' },
    { day: 5, start: 10, end: 18, label: 'Day Shift' },
    { day: 6, start: 10, end: 18, label: 'Day Shift' },
  ],
  '#bf360c',
);

// ── Component ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-multi-calendar-demo',
  standalone: true,
  imports: [CalendarComponent],
  template: `
    <app-calendar
      style="width: 100%; height: 100%"
      [calendars]="calendars()"
      [readonly]="true"
      initialView="week"
      [showSidebar]="false"
      [rowHeight]="24"
      [maxOverlapColumns]="5"
    />
  `,
  styles: `
    :host {
      display: flex;
      width: 100%;
      height: 100%;
    }
  `,
})
export class MultiCalendarDemoComponent {
  readonly calendars = signal<CalendarSource[]>([
    { id: 'alice', label: 'Alice Chen', color: '#1565c0', events: aliceShifts },
    { id: 'ben', label: 'Ben Walsh', color: '#2e7d32', events: benShifts },
    { id: 'carol', label: 'Carol Park', color: '#6a1b9a', events: carolShifts },
    { id: 'dave', label: 'Dave Torres', color: '#00695c', events: daveShifts },
    { id: 'eva', label: 'Eva Müller', color: '#bf360c', events: evaShifts },
  ]);
}
