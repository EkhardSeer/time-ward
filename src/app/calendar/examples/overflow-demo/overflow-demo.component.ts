import { Component } from '@angular/core';
import { DateTime } from 'luxon';
import { CalendarComponent } from '../../calendar.component';
import { CalendarEvent } from '../../models/calendar-event';

// ── Generate a month with many overlapping same-day events ────────────────────

const COLORS = [
  '#1565c0',
  '#2e7d32',
  '#f57c00',
  '#7b1fa2',
  '#c62828',
  '#00796b',
  '#ad1457',
  '#37474f',
];
const TITLES = [
  'Stand-up',
  'Review',
  'Planning',
  'Sync',
  'Demo',
  'Interview',
  '1:1',
  'Workshop',
  'Training',
  'Call',
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMonthEvents(): CalendarEvent[] {
  const base = DateTime.now().startOf('month');
  const events: CalendarEvent[] = [];
  let id = 1;

  // Sparse days — 0-2 events
  for (let d = 0; d < 28; d++) {
    const count = rand(0, 2);
    for (let i = 0; i < count; i++) {
      const start = base.plus({ days: d }).set({ hour: rand(8, 18), minute: 0 });
      events.push({
        id: `e${id++}`,
        title: TITLES[rand(0, TITLES.length - 1)],
        color: COLORS[rand(0, COLORS.length - 1)],
        start,
        end: start.plus({ hours: 1 }),
      });
    }
  }

  // Busy days — 5-8 events (overflow visible)
  [-3, -1, 2, 5, 9, 14].forEach((offset) => {
    const count = rand(5, 8);
    const day = DateTime.now().startOf('day').plus({ days: offset });
    for (let i = 0; i < count; i++) {
      const start = day.set({ hour: rand(8, 18), minute: 0 });
      events.push({
        id: `e${id++}`,
        title: TITLES[rand(0, TITLES.length - 1)],
        color: COLORS[rand(0, COLORS.length - 1)],
        start,
        end: start.plus({ hours: 1 }),
      });
    }
  });

  return events;
}

@Component({
  selector: 'app-overflow-demo',
  standalone: true,
  imports: [CalendarComponent],
  template: `
    <app-calendar
      style="width: 100%; height: 100%"
      [events]="events"
      [readonly]="true"
      initialView="month"
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
export class OverflowDemoComponent {
  readonly events = generateMonthEvents();
}
