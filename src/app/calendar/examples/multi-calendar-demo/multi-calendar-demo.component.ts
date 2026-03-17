import { AfterViewInit, Component, signal, TemplateRef, ViewChild } from '@angular/core';
import { DateTime } from 'luxon';
import { CalendarComponent } from '../../calendar.component';
import { CalendarSource } from '../../models/calendar-source';
import { buildCalendarEvents } from '../../utils/build-calendar-events';

// ── Work events ───────────────────────────────────────────────────────────────

function workEvents() {
  const t = DateTime.now().startOf('day');
  return buildCalendarEvents(
    [
      {
        id: 'w1',
        title: 'Team Stand-up',
        start: t.set({ hour: 9 }),
        end: t.set({ hour: 9, minute: 30 }),
      },
      {
        id: 'w2',
        title: 'Sprint Review',
        start: t.plus({ days: 1 }).set({ hour: 10 }),
        end: t.plus({ days: 1 }).set({ hour: 11 }),
      },
      {
        id: 'w3',
        title: 'Client Call',
        start: t.plus({ days: 2 }).set({ hour: 14 }),
        end: t.plus({ days: 2 }).set({ hour: 15 }),
      },
      {
        id: 'w4',
        title: 'Architecture Sync',
        start: t.plus({ days: 3 }).set({ hour: 11 }),
        end: t.plus({ days: 3 }).set({ hour: 12 }),
      },
      {
        id: 'w5',
        title: '1:1 with Manager',
        start: t.plus({ days: 4 }).set({ hour: 16 }),
        end: t.plus({ days: 4 }).set({ hour: 17 }),
      },
    ],
    'id',
    'title',
    'start',
    'end',
    { color: '#1565c0' },
  );
}

// ── Personal events ───────────────────────────────────────────────────────────

function personalEvents() {
  const t = DateTime.now().startOf('day');
  return buildCalendarEvents(
    [
      { id: 'p1', title: 'Gym', start: t.set({ hour: 7 }), end: t.set({ hour: 8 }) },
      {
        id: 'p2',
        title: 'Doctor Appointment',
        start: t.plus({ days: 1 }).set({ hour: 13 }),
        end: t.plus({ days: 1 }).set({ hour: 13, minute: 30 }),
      },
      {
        id: 'p3',
        title: 'Dinner with Family',
        start: t.plus({ days: 2 }).set({ hour: 19 }),
        end: t.plus({ days: 2 }).set({ hour: 21 }),
      },
      {
        id: 'p4',
        title: 'Hiking Trip',
        start: t.plus({ days: 5 }).set({ hour: 8 }),
        end: t.plus({ days: 5 }).set({ hour: 17 }),
      },
    ],
    'id',
    'title',
    'start',
    'end',
    { color: '#2e7d32' },
  );
}

// ── Holiday events ────────────────────────────────────────────────────────────

function holidayEvents() {
  const t = DateTime.now().startOf('day');
  return buildCalendarEvents(
    [
      {
        id: 'h1',
        title: 'Public Holiday',
        start: t.plus({ days: 6 }).set({ hour: 0 }),
        end: t.plus({ days: 6 }).set({ hour: 23, minute: 59 }),
      },
    ],
    'id',
    'title',
    'start',
    'end',
    { color: '#e65100' },
  );
}

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
    { id: 'work', label: 'Work', color: '#1565c0', events: workEvents() },
    { id: 'personal', label: 'Personal', color: '#2e7d32', events: personalEvents() },
    { id: 'holidays', label: 'Holidays', color: '#e65100', events: holidayEvents() },
  ]);
}
