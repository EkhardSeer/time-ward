import { Component, signal } from '@angular/core';
import { DateTime } from 'luxon';
import { MatIconModule } from '@angular/material/icon';
import { CalendarComponent } from '../../calendar.component';
import { CalendarEvent } from '../../models/calendar-event';

@Component({
  selector: 'app-drag-demo',
  standalone: true,
  imports: [CalendarComponent, MatIconModule],
  template: `
    <div class="demo-layout">
      <app-calendar
        style="flex: 1; min-width: 0; height: 100%"
        [events]="events()"
        [readonly]="false"
        [showFab]="false"
        initialView="week"
        [showSidebar]="false"
        (eventAdded)="onAdded($event)"
        (eventUpdated)="onUpdated($event)"
        (eventDeleted)="onDeleted($event)"
      />
      <div class="selection-log">
        <div class="log-header">
          <mat-icon>touch_app</mat-icon>
          <span>Drag Log</span>
          <button class="clear-btn" (click)="log.set([])">Clear</button>
        </div>
        <div class="hint-box">
          <mat-icon class="hint-icon">info</mat-icon>
          <span
            >Click &amp; drag on an empty time slot to create an event. Drag-handles on existing
            chips to resize.</span
          >
        </div>
        <div class="log-body">
          @if (log().length === 0) {
            <p class="log-empty">Drag to select a time range — details appear here.</p>
          }
          @for (entry of log(); track $index) {
            <div class="log-entry" [class]="'log-' + entry.type">
              <div class="entry-top">
                <span class="entry-badge">{{ entry.type }}</span>
                <span class="entry-time">{{ entry.time }}</span>
              </div>
              <span class="entry-title">{{ entry.title }}</span>
              <span class="entry-range">{{ entry.range }}</span>
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

    .selection-log {
      width: 240px;
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

    .hint-box {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      padding: 8px 12px;
      background: #e3f2fd;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      font-size: 0.78rem;
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.5;
      flex-shrink: 0;
    }

    .hint-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #1565c0;
      flex-shrink: 0;
      margin-top: 1px;
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
      padding: 7px 10px;
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

    .entry-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .entry-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .log-added .entry-badge {
      color: #2e7d32;
    }
    .log-updated .entry-badge {
      color: #1565c0;
    }
    .log-deleted .entry-badge {
      color: #c62828;
    }

    .entry-time {
      font-size: 0.68rem;
      color: rgba(0, 0, 0, 0.38);
    }
    .entry-title {
      font-size: 0.82rem;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.75);
    }
    .entry-range {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.55);
    }
  `,
})
export class DragDemoComponent {
  events = signal<CalendarEvent[]>([]);
  log = signal<{ type: string; title: string; range: string; time: string }[]>([]);

  private push(type: string, event: CalendarEvent) {
    this.log.update((l) => [
      {
        type,
        title: event.title || '(untitled)',
        range: `${event.start.toFormat('EEE d MMM, HH:mm')} – ${event.end.toFormat('HH:mm')}`,
        time: DateTime.now().toFormat('HH:mm:ss'),
      },
      ...l,
    ]);
  }

  onAdded(event: CalendarEvent) {
    this.events.update((evs) => [...evs, event]);
    this.push('added', event);
  }

  onUpdated(event: CalendarEvent) {
    this.events.update((evs) => evs.map((e) => (e.id === event.id ? event : e)));
    this.push('updated', event);
  }

  onDeleted(id: string) {
    const deleted = this.events().find((e) => e.id === id);
    this.events.update((evs) => evs.filter((e) => e.id !== id));
    if (deleted) this.push('deleted', deleted);
  }
}
