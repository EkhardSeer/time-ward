import { AfterViewInit, Component, signal, TemplateRef, ViewChild } from '@angular/core';
import { DateTime } from 'luxon';
import { CalendarComponent } from '../../calendar.component';
import { CalendarAction } from '../../models/calendar-action';
import { CalendarEvent } from '../../models/calendar-event';

// ── Simple meeting generator ───────────────────────────────────────────────────

const MEETING_TITLES = [
  'Team Stand-up',
  'Sprint Review',
  'Design Sync',
  'Client Call',
  'Architecture Review',
  'Backlog Grooming',
  '1:1 with Manager',
  'Release Planning',
];

const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c62828', '#00796b'];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMeetings(count = 6): CalendarEvent[] {
  const today = DateTime.now().startOf('day');
  return Array.from({ length: count }, (_, i) => {
    const dayOffset = rand(-2, 4);
    const startH = rand(8, 17);
    const durationH = rand(1, 2);
    const start = today.plus({ days: dayOffset }).set({ hour: startH, minute: 0 });
    return {
      id: `meeting-${i}-${Date.now()}`,
      title: MEETING_TITLES[rand(0, MEETING_TITLES.length - 1)],
      start,
      end: start.plus({ hours: durationH }),
      color: COLORS[rand(0, COLORS.length - 1)],
    };
  });
}

// ── Component ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-actions-demo',
  standalone: true,
  imports: [CalendarComponent],
  template: `
    <app-calendar
      style="width: 100%; height: 100%"
      [events]="events()"
      [readonly]="true"
      initialView="week"
      [showSidebar]="false"
      [actions]="actions"
      (actionTriggered)="onAction($event)"
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
export class ActionsDemoComponent {
  events = signal<CalendarEvent[]>(generateMeetings());

  readonly actions: CalendarAction[] = [
    { id: 'refresh', label: 'Refresh Meetings', icon: 'refresh' },
    { id: 'clear', label: 'Clear All', icon: 'clear_all', divider: true },
  ];

  onAction(action: CalendarAction) {
    if (action.id === 'refresh') {
      this.events.set(generateMeetings());
    } else if (action.id === 'clear') {
      this.events.set([]);
    }
  }
}
