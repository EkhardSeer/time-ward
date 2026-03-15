import { AfterViewInit, Component, signal, TemplateRef, ViewChild } from '@angular/core';
import { DateTime } from 'luxon';
import { CalendarComponent } from '../calendar/calendar.component';
import { CalendarEvent } from '../calendar/calendar-event';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

// ── Domain models ─────────────────────────────────────────────────────────────

export interface ProductionOrder {
  orderId: string;
  article: string;
  articleNo: string;
  quantity: number;
  unit: string;
  machine: string;
  status: 'planned' | 'running' | 'done';
  components: { name: string; qty: number; unit: string }[];
}

export interface ShiftInfo {
  name: string;
  crew: string;
  capacity: number;
}

// ── Colors ────────────────────────────────────────────────────────────────────

const COLORS = {
  shiftEarly: '#1565c0',
  shiftDay: '#0277bd',
  shiftLate: '#006064',
  orderPlanned: '#2e7d32',
  orderRunning: '#f57c00',
  orderDone: '#546e7a',
};

// ── Shift generator (Mon–Fri, 3×8 h per day) ─────────────────────────────────

type ShiftDef = { name: string; startH: number; endH: number; color: string; crew: string };

const SHIFT_DEFS: ShiftDef[] = [
  { name: 'Early', startH: 6, endH: 14, color: COLORS.shiftEarly, crew: 'Team A' },
  { name: 'Day', startH: 14, endH: 22, color: COLORS.shiftDay, crew: 'Team B' },
  { name: 'Late', startH: 22, endH: 30, color: COLORS.shiftLate, crew: 'Team C' }, // 30 = 6 next day
];

function generateShifts(
  from: DateTime,
  to: DateTime,
  tpl: TemplateRef<{ $implicit: CalendarEvent }>,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  let day = from.startOf('day');
  while (day <= to) {
    if (day.weekday <= 5) {
      SHIFT_DEFS.forEach((def, i) => {
        const start = day.set({ hour: def.startH % 24, minute: 0, second: 0 });
        const end =
          def.endH >= 24
            ? day.plus({ days: 1 }).set({ hour: def.endH - 24, minute: 0, second: 0 })
            : day.set({ hour: def.endH, minute: 0, second: 0 });
        const info: ShiftInfo = { name: `${def.name} Shift`, crew: def.crew, capacity: 100 };
        events.push({
          id: `shift-${day.toISODate()}-${i}`,
          title: `${def.name} · ${def.crew}`,
          start,
          end,
          color: def.color,
          sidebarTemplate: tpl,
          data: { type: 'shift', source: info },
        });
      });
    }
    day = day.plus({ days: 1 });
  }
  return events;
}

// ── Mock production orders ────────────────────────────────────────────────────

function buildOrders(tpl: TemplateRef<{ $implicit: CalendarEvent }>): CalendarEvent[] {
  const week = DateTime.now().startOf('week');

  const defs: { day: number; startH: number; hours: number; order: ProductionOrder }[] = [
    {
      day: 0,
      startH: 6,
      hours: 4,
      order: {
        orderId: 'PA-2026-0042',
        article: 'Gearbox Housing',
        articleNo: 'GB-1140',
        quantity: 25,
        unit: 'pcs',
        machine: 'CNC-3',
        status: 'done',
        components: [
          { name: 'Aluminium block', qty: 25, unit: 'pcs' },
          { name: 'Bearing 6204', qty: 50, unit: 'pcs' },
        ],
      },
    },
    {
      day: 0,
      startH: 10,
      hours: 6,
      order: {
        orderId: 'PA-2026-0043',
        article: 'Drive Shaft',
        articleNo: 'DS-0880',
        quantity: 10,
        unit: 'pcs',
        machine: 'LATHE-1',
        status: 'running',
        components: [
          { name: 'Steel bar Ø40', qty: 10, unit: 'pcs' },
          { name: 'Key 8×7×50', qty: 10, unit: 'pcs' },
        ],
      },
    },
    {
      day: 1,
      startH: 6,
      hours: 8,
      order: {
        orderId: 'PA-2026-0044',
        article: 'Cover Plate',
        articleNo: 'CP-0221',
        quantity: 100,
        unit: 'pcs',
        machine: 'PRESS-2',
        status: 'planned',
        components: [
          { name: 'Sheet metal 2 mm', qty: 5, unit: 'sheets' },
          { name: 'Seal ring M60', qty: 100, unit: 'pcs' },
        ],
      },
    },
    {
      day: 2,
      startH: 14,
      hours: 5,
      order: {
        orderId: 'PA-2026-0045',
        article: 'Motor Bracket',
        articleNo: 'MB-0934',
        quantity: 40,
        unit: 'pcs',
        machine: 'CNC-3',
        status: 'planned',
        components: [
          { name: 'Aluminium profile 60×40', qty: 40, unit: 'pcs' },
          { name: 'M8×20 bolt', qty: 160, unit: 'pcs' },
        ],
      },
    },
    {
      day: 3,
      startH: 6,
      hours: 3,
      order: {
        orderId: 'PA-2026-0046',
        article: 'Pump Housing',
        articleNo: 'PH-0567',
        quantity: 8,
        unit: 'pcs',
        machine: 'CNC-3',
        status: 'planned',
        components: [
          { name: 'Cast iron blank', qty: 8, unit: 'pcs' },
          { name: 'O-ring kit 50 mm', qty: 8, unit: 'sets' },
        ],
      },
    },
  ];

  return defs.map((d) => {
    const start = week.plus({ days: d.day }).set({ hour: d.startH, minute: 0, second: 0 });
    const end = start.plus({ hours: d.hours });
    const color =
      d.order.status === 'done'
        ? COLORS.orderDone
        : d.order.status === 'running'
          ? COLORS.orderRunning
          : COLORS.orderPlanned;
    return {
      id: d.order.orderId,
      title: `${d.order.orderId} · ${d.order.article}`,
      start,
      end,
      color,
      sidebarTemplate: tpl,
      data: { type: 'order', source: d.order },
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-production-calendar',
  standalone: true,
  imports: [CalendarComponent, MatIconModule, MatButtonModule, MatDividerModule],
  template: `
    <app-calendar
      style="width: 100%; height: 100%"
      [events]="events()"
      [readonly]="true"
      initialView="week"
    />

    <!-- ── Order details template ──────────────────────────────────────────── -->
    <ng-template #orderTpl let-event>
      <div class="detail-panel">
        <div class="detail-header" [style.background]="event.color">
          <mat-icon>precision_manufacturing</mat-icon>
          <span>{{ orderOf(event).orderId }}</span>
        </div>
        <div class="detail-body">
          <div class="detail-row">
            <span class="lbl">Article</span>
            <span class="val">{{ orderOf(event).article }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">Article No.</span>
            <span class="val">{{ orderOf(event).articleNo }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">Quantity</span>
            <span class="val">{{ orderOf(event).quantity }} {{ orderOf(event).unit }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">Machine</span>
            <span class="val">{{ orderOf(event).machine }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">Status</span>
            <span class="status-chip" [class]="'status-' + orderOf(event).status">
              {{ orderOf(event).status }}
            </span>
          </div>
          <div class="detail-row">
            <span class="lbl">Start</span>
            <span class="val">{{ event.start.toFormat('dd.MM.yyyy HH:mm') }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">End</span>
            <span class="val">{{ event.end.toFormat('dd.MM.yyyy HH:mm') }}</span>
          </div>

          <mat-divider style="margin: 12px 0" />

          <div class="section-title">Components</div>
          @for (c of orderOf(event).components; track c.name) {
            <div class="detail-row component-row">
              <span class="lbl">{{ c.name }}</span>
              <span class="val">{{ c.qty }} {{ c.unit }}</span>
            </div>
          }
        </div>
      </div>
    </ng-template>

    <!-- ── Shift details template ───────────────────────────────────────────── -->
    <ng-template #shiftTpl let-event>
      <div class="detail-panel">
        <div class="detail-header" [style.background]="event.color">
          <mat-icon>groups</mat-icon>
          <span>{{ shiftOf(event).name }}</span>
        </div>
        <div class="detail-body">
          <div class="detail-row">
            <span class="lbl">Crew</span>
            <span class="val">{{ shiftOf(event).crew }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">Start</span>
            <span class="val">{{ event.start.toFormat('dd.MM.yyyy HH:mm') }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">End</span>
            <span class="val">{{ event.end.toFormat('dd.MM.yyyy HH:mm') }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">Capacity</span>
            <span class="val">{{ shiftOf(event).capacity }} %</span>
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
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
      font-size: 0.875rem;
    }

    .component-row {
      padding-left: 8px;
    }

    .section-title {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(0, 0, 0, 0.4);
    }

    .lbl {
      color: rgba(0, 0, 0, 0.5);
      flex-shrink: 0;
    }

    .val {
      font-weight: 500;
      text-align: right;
    }

    .status-chip {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 10px;
      text-transform: capitalize;
    }

    .status-planned {
      background: #e3f2fd;
      color: #1565c0;
    }
    .status-running {
      background: #fff3e0;
      color: #e65100;
    }
    .status-done {
      background: #eceff1;
      color: #37474f;
    }
  `,
})
export class ProductionCalendarComponent implements AfterViewInit {
  @ViewChild('orderTpl') private orderTpl!: TemplateRef<{ $implicit: CalendarEvent }>;
  @ViewChild('shiftTpl') private shiftTpl!: TemplateRef<{ $implicit: CalendarEvent }>;

  events = signal<CalendarEvent[]>([]);

  ngAfterViewInit() {
    const from = DateTime.now().startOf('week');
    const to = from.plus({ weeks: 3 });
    this.events.set([...generateShifts(from, to, this.shiftTpl), ...buildOrders(this.orderTpl)]);
  }

  orderOf(event: CalendarEvent): ProductionOrder {
    return (event.data as { source: ProductionOrder }).source;
  }

  shiftOf(event: CalendarEvent): ShiftInfo {
    return (event.data as { source: ShiftInfo }).source;
  }
}
