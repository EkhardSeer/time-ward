import { AfterViewInit, Component, signal, TemplateRef, ViewChild } from '@angular/core';
import { DateTime } from 'luxon';
import { MatIconModule } from '@angular/material/icon';
import { CalendarComponent } from '../../calendar.component';
import { CalendarEvent } from '../../models/calendar-event';
import { buildCalendarEvents } from '../../utils/build-calendar-events';

// ── Domain model (as if received from an API) ──────────────────────────────────

interface ApiBooking {
  bookingId: number;
  resource: string;
  bookedBy: string;
  startIso: string; // ISO string — as you'd get from a REST API
  endIso: string;
  category: 'room' | 'equipment' | 'vehicle';
}

// Simulated API response
const API_RESPONSE: ApiBooking[] = [
  {
    bookingId: 1,
    resource: 'Conference Room A',
    bookedBy: 'Alice Meyer',
    startIso: today(9, 0),
    endIso: today(10, 0),
    category: 'room',
  },
  {
    bookingId: 2,
    resource: 'Projector #2',
    bookedBy: 'Bob Schmidt',
    startIso: today(10, 0),
    endIso: today(11, 0),
    category: 'equipment',
  },
  {
    bookingId: 3,
    resource: 'Company Car #1',
    bookedBy: 'Clara Bauer',
    startIso: todayPlus(1, 8, 0),
    endIso: todayPlus(1, 12, 0),
    category: 'vehicle',
  },
  {
    bookingId: 4,
    resource: 'Board Room',
    bookedBy: 'David Lange',
    startIso: todayPlus(1, 14, 0),
    endIso: todayPlus(1, 16, 0),
    category: 'room',
  },
  {
    bookingId: 5,
    resource: 'Drone Camera',
    bookedBy: 'Eva Fischer',
    startIso: todayPlus(2, 9, 0),
    endIso: todayPlus(2, 10, 30),
    category: 'equipment',
  },
  {
    bookingId: 6,
    resource: 'Conference Room B',
    bookedBy: 'Frank Wolf',
    startIso: todayPlus(2, 11, 0),
    endIso: todayPlus(2, 12, 0),
    category: 'room',
  },
  {
    bookingId: 7,
    resource: 'Company Van #2',
    bookedBy: 'Alice Meyer',
    startIso: todayPlus(3, 7, 0),
    endIso: todayPlus(3, 17, 0),
    category: 'vehicle',
  },
  {
    bookingId: 8,
    resource: 'Laptop Pool #3',
    bookedBy: 'Bob Schmidt',
    startIso: todayPlus(3, 13, 0),
    endIso: todayPlus(3, 14, 0),
    category: 'equipment',
  },
];

function today(h: number, m: number) {
  return DateTime.now().startOf('day').set({ hour: h, minute: m }).toISO()!;
}
function todayPlus(days: number, h: number, m: number) {
  return DateTime.now().startOf('day').plus({ days }).set({ hour: h, minute: m }).toISO()!;
}

const CATEGORY_COLORS: Record<ApiBooking['category'], string> = {
  room: '#1565c0',
  equipment: '#2e7d32',
  vehicle: '#e65100',
};

// ── Component ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-builder-demo',
  standalone: true,
  imports: [CalendarComponent, MatIconModule],
  template: `
    <div class="demo-layout">
      <!-- Raw data panel -->
      <div class="data-panel">
        <div class="panel-header">
          <mat-icon>code</mat-icon>
          <span>API Response</span>
          <span class="badge">{{ apiData.length }} items</span>
        </div>
        <div class="panel-body">
          <div class="legend">
            @for (cat of categories; track cat.key) {
              <span class="legend-dot" [style.background]="cat.color"></span>
              <span class="legend-label">{{ cat.key }}</span>
            }
          </div>
          <pre class="json-preview">{{ jsonPreview }}</pre>
        </div>
        <div class="panel-footer">
          <span class="arrow-hint">
            <mat-icon>arrow_forward</mat-icon>
            buildCalendarEvents() maps these to the calendar
          </span>
        </div>
      </div>

      <app-calendar
        style="flex: 1; min-width: 0; height: 100%"
        [events]="events()"
        [readonly]="true"
        initialView="week"
        [detailsTemplate]="detailsTpl"
      />
    </div>

    <ng-template #detailsTpl let-event>
      <div class="detail-panel">
        <div class="detail-header" [style.background]="event.color">
          <mat-icon>{{ iconFor(booking(event).category) }}</mat-icon>
          <span>{{ event.title }}</span>
        </div>
        <div class="detail-body">
          <div class="detail-row">
            <span class="dl">ID</span>
            <code>#{{ booking(event).bookingId }}</code>
          </div>
          <div class="detail-row">
            <span class="dl">Category</span>
            <span class="category-chip" [style.background]="event.color">{{
              booking(event).category
            }}</span>
          </div>
          <div class="detail-row">
            <span class="dl">Booked by</span>
            <span>{{ booking(event).bookedBy }}</span>
          </div>
          <div class="detail-row">
            <span class="dl">Start</span>
            <span>{{ event.start.toFormat('EEE d MMM, HH:mm') }}</span>
          </div>
          <div class="detail-row">
            <span class="dl">End</span>
            <span>{{ event.end.toFormat('HH:mm') }}</span>
          </div>
          <div class="code-note">
            <code>event.data</code> holds the original <code>ApiBooking</code> object.
          </div>
        </div>
      </div>
    </ng-template>
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

    .data-panel {
      width: 260px;
      flex-shrink: 0;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #37474f;
      color: white;
      font-size: 0.9rem;
      font-weight: 500;
      flex-shrink: 0;
    }

    .badge {
      margin-left: auto;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      padding: 1px 8px;
      font-size: 0.72rem;
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .legend {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px 10px;
      padding: 4px 2px;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }

    .legend-label {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.65);
    }

    .json-preview {
      background: #f5f5f5;
      border-radius: 4px;
      padding: 8px;
      font-size: 0.65rem;
      line-height: 1.5;
      margin: 0;
      overflow-x: auto;
      white-space: pre-wrap;
      color: #333;
      flex: 1;
    }

    .panel-footer {
      padding: 8px 12px;
      background: #f5f5f5;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      flex-shrink: 0;
    }

    .arrow-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      color: rgba(0, 0, 0, 0.55);
      font-style: italic;
    }

    /* sidebar */
    .detail-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .detail-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      color: white;
      font-weight: 500;
      font-size: 0.95rem;
      flex-shrink: 0;
    }
    .detail-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
    }
    .dl {
      color: rgba(0, 0, 0, 0.5);
      min-width: 72px;
      flex-shrink: 0;
    }
    .category-chip {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 10px;
      color: white;
      text-transform: capitalize;
    }
    .code-note {
      margin-top: 8px;
      padding: 8px 10px;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 0.78rem;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.6;
    }
  `,
})
export class BuilderDemoComponent implements AfterViewInit {
  @ViewChild('detailsTpl') private detailsTpl!: TemplateRef<{ $implicit: CalendarEvent }>;

  readonly apiData = API_RESPONSE;
  events = signal<CalendarEvent[]>([]);

  readonly categories = Object.entries(CATEGORY_COLORS).map(([key, color]) => ({ key, color }));

  readonly jsonPreview = JSON.stringify(
    API_RESPONSE.map(({ bookingId, resource, bookedBy, category }) => ({
      bookingId,
      resource,
      bookedBy,
      category,
      startIso: '…',
      endIso: '…',
    })),
    null,
    2,
  );

  ngAfterViewInit() {
    this.events.set(
      buildCalendarEvents(API_RESPONSE, 'bookingId', 'resource', 'startIso', 'endIso', {
        color: (b) => CATEGORY_COLORS[b.category],
        sidebarTemplate: this.detailsTpl,
      }),
    );
  }

  booking(event: CalendarEvent): ApiBooking {
    return event.data as ApiBooking;
  }

  iconFor(category: ApiBooking['category']): string {
    return category === 'room'
      ? 'meeting_room'
      : category === 'vehicle'
        ? 'directions_car'
        : 'devices';
  }
}
