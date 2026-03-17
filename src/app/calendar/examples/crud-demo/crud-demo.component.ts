import { Component, signal } from '@angular/core';
import { DateTime } from 'luxon';
import { MatIconModule } from '@angular/material/icon';
import { CalendarComponent } from '../../calendar.component';
import { CalendarEvent } from '../../models/calendar-event';

let nextId = 100;

const SEED_EVENTS: CalendarEvent[] = [
  {
    id: 'c1',
    title: 'Team Stand-up',
    color: '#1565c0',
    start: DateTime.now().startOf('day').set({ hour: 9 }),
    end: DateTime.now().startOf('day').set({ hour: 9, minute: 30 }),
  },
  {
    id: 'c2',
    title: 'Sprint Planning',
    color: '#2e7d32',
    start: DateTime.now().startOf('day').set({ hour: 13 }),
    end: DateTime.now().startOf('day').set({ hour: 15 }),
  },
  {
    id: 'c3',
    title: 'Design Review',
    color: '#6a1b9a',
    start: DateTime.now().plus({ days: 1 }).startOf('day').set({ hour: 10 }),
    end: DateTime.now().plus({ days: 1 }).startOf('day').set({ hour: 11 }),
  },
];

@Component({
  selector: 'app-crud-demo',
  standalone: true,
  imports: [CalendarComponent, MatIconModule],
  template: `
    <div class="demo-layout">
      <app-calendar
        style="flex: 1; min-width: 0; height: 100%"
        [events]="events()"
        initialView="week"
        (eventAdded)="onAdded($event)"
        (eventUpdated)="onUpdated($event)"
        (eventDeleted)="onDeleted($event)"
      />
      <div class="event-log">
        <div class="log-header">
          <mat-icon>history</mat-icon>
          <span>Event Log</span>
          <button class="clear-btn" (click)="log.set([])">Clear</button>
        </div>
        <div class="log-body">
          @if (log().length === 0) {
            <p class="log-empty">Add, edit or delete an event to see changes here.</p>
          }
          @for (entry of log(); track $index) {
            <div class="log-entry" [class]="'log-' + entry.type">
              <span class="log-badge">{{ entry.type }}</span>
              <span class="log-text">{{ entry.message }}</span>
              <span class="log-time">{{ entry.time }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      width: 100%;
      height: 100%;
    }

    .demo-layout {
      display: flex;
      width: 100%;
      height: 100%;
      gap: 16px;
    }

    .event-log {
      width: 260px;
      flex-shrink: 0;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .log-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: var(--mat-sys-primary);
      color: white;
      font-size: 0.9rem;
      font-weight: 500;
      flex-shrink: 0;
    }

    .clear-btn {
      margin-left: auto;
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: white;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 0.75rem;
      cursor: pointer;
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .log-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .log-empty {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.45);
      text-align: center;
      margin-top: 24px;
      padding: 0 12px;
      line-height: 1.5;
    }

    .log-entry {
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 0.78rem;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .log-added {
      background: #e8f5e9;
    }
    .log-updated {
      background: #e3f2fd;
    }
    .log-deleted {
      background: #fce4ec;
    }

    .log-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .log-added .log-badge {
      color: #2e7d32;
    }
    .log-updated .log-badge {
      color: #1565c0;
    }
    .log-deleted .log-badge {
      color: #c62828;
    }

    .log-text {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.75);
    }

    .log-time {
      font-size: 0.68rem;
      color: rgba(0, 0, 0, 0.38);
    }
  `,
})
export class CrudDemoComponent {
  events = signal<CalendarEvent[]>([...SEED_EVENTS]);
  log = signal<{ type: string; message: string; time: string }[]>([]);

  private addLog(type: string, message: string) {
    this.log.update((l) => [{ type, message, time: DateTime.now().toFormat('HH:mm:ss') }, ...l]);
  }

  onAdded(event: CalendarEvent) {
    this.events.update((evs) => [...evs, { ...event, id: String(nextId++) }]);
    this.addLog('added', `"${event.title}" on ${event.start.toFormat('EEE d MMM, HH:mm')}`);
  }

  onUpdated(event: CalendarEvent) {
    this.events.update((evs) => evs.map((e) => (e.id === event.id ? event : e)));
    this.addLog(
      'updated',
      `"${event.title}" → ${event.start.toFormat('HH:mm')}–${event.end.toFormat('HH:mm')}`,
    );
  }

  onDeleted(id: string) {
    const deleted = this.events().find((e) => e.id === id);
    this.events.update((evs) => evs.filter((e) => e.id !== id));
    this.addLog('deleted', `"${deleted?.title ?? id}"`);
  }
}
