import { AfterViewInit, Component, signal, TemplateRef, ViewChild } from '@angular/core';
import { DateTime } from 'luxon';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CalendarComponent } from '../../calendar.component';
import { CalendarAction } from '../../models/calendar-action';
import { CalendarEvent } from '../../models/calendar-event';

// ── Domain types ───────────────────────────────────────────────────────────────

interface MeetingMeta {
  type: 'meeting';
  organizer: string;
  location: string;
  attendees: string[];
  agenda: string[];
  notes?: string;
}

interface TaskMeta {
  type: 'task';
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  checklist: { label: string; done: boolean }[];
  tags: string[];
}

interface DeadlineMeta {
  type: 'deadline';
  project: string;
  owner: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  dismissed: boolean;
}

type EventMeta = MeetingMeta | TaskMeta | DeadlineMeta;

// ── Event factory ─────────────────────────────────────────────────────────────

function ev(
  id: string,
  title: string,
  color: string,
  dayOffset: number,
  startH: number,
  hours: number,
  meta: EventMeta,
): CalendarEvent {
  const start = DateTime.now()
    .startOf('day')
    .plus({ days: dayOffset })
    .set({ hour: startH, minute: 0 });
  return { id, title, color, start, end: start.plus({ hours }), data: meta };
}

// ── Event data ─────────────────────────────────────────────────────────────────

const RAW_EVENTS: CalendarEvent[] = [
  // ── Meetings ────────────────────────────────────────────────────────────────
  ev('m1', 'Sprint Review', '#1565c0', 0, 10, 1, {
    type: 'meeting',
    organizer: 'Alice Meyer',
    location: 'Room 3B',
    attendees: ['Alice Meyer', 'Bob Schmidt', 'Clara Bauer', 'David Lange'],
    agenda: ['Demo completed stories', 'Review velocity', 'Stakeholder feedback'],
    notes: 'Ensure demo environment is ready 30 min before.',
  }),
  ev('m2', 'Design Sync', '#6a1b9a', 2, 14, 1, {
    type: 'meeting',
    organizer: 'Clara Bauer',
    location: 'Zoom',
    attendees: ['Clara Bauer', 'Eva Fischer'],
    agenda: ['Review Figma prototypes', 'Component library updates'],
  }),
  ev('m3', 'Client Demo', '#00695c', 3, 9, 2, {
    type: 'meeting',
    organizer: 'David Lange',
    location: 'Client HQ, Floor 5',
    attendees: ['David Lange', 'Alice Meyer', 'Client Team'],
    agenda: ['Welcome & intro', 'Live product walkthrough', 'Q&A'],
    notes: 'Dress code: business casual.',
  }),
  // ── Tasks ────────────────────────────────────────────────────────────────────
  ev('t1', 'API Integration', '#2e7d32', 1, 9, 3, {
    type: 'task',
    assignee: 'Bob Schmidt',
    priority: 'high',
    checklist: [
      { label: 'Define endpoint schema', done: true },
      { label: 'Implement auth middleware', done: true },
      { label: 'Write integration tests', done: false },
      { label: 'Update API docs', done: false },
    ],
    tags: ['backend', 'sprint-12'],
  }),
  ev('t2', 'UI Polish', '#f57c00', 2, 13, 2, {
    type: 'task',
    assignee: 'Eva Fischer',
    priority: 'medium',
    checklist: [
      { label: 'Fix responsive breakpoints', done: true },
      { label: 'Align icon sizes', done: false },
      { label: 'Dark mode contrast check', done: false },
    ],
    tags: ['frontend', 'design'],
  }),
  // ── Deadlines ────────────────────────────────────────────────────────────────
  ev('d1', 'Release v2.4', '#c62828', 4, 8, 1, {
    type: 'deadline',
    project: 'TimeWard',
    owner: 'David Lange',
    description: 'Final production release including API v2 and new calendar widget.',
    risk: 'high',
    dismissed: false,
  }),
  ev('d2', 'Security Audit', '#ad1457', 5, 10, 2, {
    type: 'deadline',
    project: 'Platform',
    owner: 'Frank Wolf',
    description: 'External penetration test and OWASP checklist sign-off.',
    risk: 'medium',
    dismissed: false,
  }),
];

// ── Component ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-sidebar-demo',
  standalone: true,
  imports: [CalendarComponent, MatIconModule, MatButtonModule],
  template: `
    <app-calendar
      style="width: 100%; height: 100%"
      [events]="events()"
      [readonly]="true"
      initialView="week"
      [actions]="deadlineActions"
      (actionTriggered)="onAction($event)"
    />

    <!-- ── Style 1: Meeting card ──────────────────────────────────────────── -->
    <ng-template #meetingTpl let-event>
      <div class="panel meeting-panel">
        <div class="panel-header" [style.background]="event.color">
          <mat-icon>groups</mat-icon>
          <span>{{ event.title }}</span>
        </div>
        <div class="panel-body">
          <div class="info-row">
            <mat-icon class="ri">person</mat-icon>
            <span class="rl">Organizer</span>
            <span class="rv">{{ asMeeting(event).organizer }}</span>
          </div>
          <div class="info-row">
            <mat-icon class="ri">location_on</mat-icon>
            <span class="rl">Location</span>
            <span class="rv">{{ asMeeting(event).location }}</span>
          </div>
          <div class="info-row">
            <mat-icon class="ri">schedule</mat-icon>
            <span class="rl">Time</span>
            <span class="rv"
              >{{ event.start.toFormat('HH:mm') }} – {{ event.end.toFormat('HH:mm') }}</span
            >
          </div>
          <div class="section-title">Attendees</div>
          <div class="chip-row">
            @for (a of asMeeting(event).attendees; track a) {
              <span class="chip blue-chip">{{ a }}</span>
            }
          </div>
          <div class="section-title">Agenda</div>
          <ol class="agenda-list">
            @for (item of asMeeting(event).agenda; track item) {
              <li>{{ item }}</li>
            }
          </ol>
          @if (asMeeting(event).notes) {
            <div class="notes-box">
              <mat-icon class="ri">sticky_note_2</mat-icon>
              <span>{{ asMeeting(event).notes }}</span>
            </div>
          }
        </div>
      </div>
    </ng-template>

    <!-- ── Style 2: Task card ─────────────────────────────────────────────── -->
    <ng-template #taskTpl let-event>
      <div class="panel task-panel">
        <div class="panel-header" [style.background]="event.color">
          <mat-icon>task_alt</mat-icon>
          <span>{{ event.title }}</span>
          <span class="priority-badge" [class]="'priority-' + asTask(event).priority">
            {{ asTask(event).priority }}
          </span>
        </div>
        <div class="panel-body">
          <div class="info-row">
            <mat-icon class="ri">person</mat-icon>
            <span class="rl">Assignee</span>
            <span class="rv">{{ asTask(event).assignee }}</span>
          </div>
          <div class="info-row">
            <mat-icon class="ri">schedule</mat-icon>
            <span class="rl">Due</span>
            <span class="rv">{{ event.end.toFormat('EEE d MMM, HH:mm') }}</span>
          </div>
          <div class="section-title">
            Checklist
            <span class="checklist-counter">
              {{ doneCount(event) }}/{{ asTask(event).checklist.length }}
            </span>
          </div>
          <div class="progress-bar-track">
            <div
              class="progress-bar-fill"
              [style.width.%]="(doneCount(event) / asTask(event).checklist.length) * 100"
              [style.background]="event.color"
            ></div>
          </div>
          <div class="checklist">
            @for (item of asTask(event).checklist; track item.label) {
              <div class="checklist-row" [class.done]="item.done">
                <mat-icon class="check-icon">{{
                  item.done ? 'check_circle' : 'radio_button_unchecked'
                }}</mat-icon>
                <span>{{ item.label }}</span>
              </div>
            }
          </div>
          <div class="section-title">Tags</div>
          <div class="chip-row">
            @for (tag of asTask(event).tags; track tag) {
              <span class="chip green-chip">{{ tag }}</span>
            }
          </div>
        </div>
      </div>
    </ng-template>

    <!-- ── Style 3: Deadline alert card ──────────────────────────────────── -->
    <ng-template #deadlineTpl let-event>
      <div class="panel deadline-panel">
        <div class="panel-header deadline-header" [style.background]="event.color">
          <mat-icon>warning</mat-icon>
          <span>{{ event.title }}</span>
          <span class="risk-badge" [class]="'risk-' + asDeadline(event).risk">
            {{ asDeadline(event).risk }} risk
          </span>
        </div>
        <div class="panel-body">
          <div
            class="deadline-countdown"
            [style.border-color]="event.color"
            [style.color]="event.color"
          >
            <mat-icon>hourglass_bottom</mat-icon>
            <span>{{ daysUntil(event) }}</span>
          </div>
          <div class="info-row">
            <mat-icon class="ri">folder</mat-icon>
            <span class="rl">Project</span>
            <span class="rv">{{ asDeadline(event).project }}</span>
          </div>
          <div class="info-row">
            <mat-icon class="ri">person</mat-icon>
            <span class="rl">Owner</span>
            <span class="rv">{{ asDeadline(event).owner }}</span>
          </div>
          <p class="deadline-desc">{{ asDeadline(event).description }}</p>
          <div class="deadline-actions">
            <button mat-stroked-button (click)="dismiss(event)">
              <mat-icon>check</mat-icon> Mark Done
            </button>
            <button mat-stroked-button (click)="snooze(event)">
              <mat-icon>snooze</mat-icon> Snooze 1d
            </button>
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

    /* ── Shared panel ─────────────────────────────────────────────────────── */
    .panel {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      color: white;
      font-weight: 500;
      font-size: 0.95rem;
      flex-shrink: 0;
    }
    .panel-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
    }
    .ri {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: rgba(0, 0, 0, 0.38);
      flex-shrink: 0;
    }
    .rl {
      color: rgba(0, 0, 0, 0.5);
      min-width: 66px;
      flex-shrink: 0;
      font-size: 0.875rem;
    }
    .rv {
      font-weight: 500;
      font-size: 0.875rem;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(0, 0, 0, 0.38);
      margin-top: 6px;
    }
    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .chip {
      font-size: 0.72rem;
      padding: 2px 10px;
      border-radius: 12px;
    }
    .blue-chip {
      background: #e3f2fd;
      color: #1565c0;
    }
    .green-chip {
      background: #e8f5e9;
      color: #2e7d32;
    }

    /* ── Meeting ─────────────────────────────────────────────────────────── */
    .agenda-list {
      margin: 0;
      padding-left: 18px;
      font-size: 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .notes-box {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      background: #fff8e1;
      border-left: 3px solid #ffa000;
      border-radius: 4px;
      padding: 8px 10px;
      font-size: 0.82rem;
      color: rgba(0, 0, 0, 0.7);
      font-style: italic;
      margin-top: 4px;
    }

    /* ── Task ────────────────────────────────────────────────────────────── */
    .priority-badge,
    .risk-badge {
      margin-left: auto;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .priority-high,
    .risk-high {
      background: rgba(255, 255, 255, 0.25);
    }
    .priority-medium,
    .risk-medium {
      background: rgba(255, 255, 255, 0.18);
    }
    .priority-low,
    .risk-low {
      background: rgba(255, 255, 255, 0.12);
    }
    .checklist-counter {
      font-size: 0.75rem;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.5);
      text-transform: none;
      letter-spacing: 0;
    }
    .progress-bar-track {
      height: 4px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease;
    }
    .checklist {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .checklist-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.75);
    }
    .checklist-row.done {
      color: rgba(0, 0, 0, 0.38);
      text-decoration: line-through;
    }
    .check-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    .checklist-row.done .check-icon {
      color: #2e7d32;
    }
    .checklist-row:not(.done) .check-icon {
      color: rgba(0, 0, 0, 0.25);
    }

    /* ── Deadline ────────────────────────────────────────────────────────── */
    .deadline-countdown {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px;
      border: 2px solid;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .deadline-desc {
      margin: 4px 0 0;
      font-size: 0.85rem;
      color: rgba(0, 0, 0, 0.65);
      line-height: 1.5;
    }
    .deadline-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .deadline-actions button {
      flex: 1;
      font-size: 0.8rem;
    }
  `,
})
export class SidebarDemoComponent implements AfterViewInit {
  @ViewChild('meetingTpl') private meetingTpl!: TemplateRef<{ $implicit: CalendarEvent }>;
  @ViewChild('taskTpl') private taskTpl!: TemplateRef<{ $implicit: CalendarEvent }>;
  @ViewChild('deadlineTpl') private deadlineTpl!: TemplateRef<{ $implicit: CalendarEvent }>;

  events = signal<CalendarEvent[]>([]);

  readonly deadlineActions: CalendarAction[] = [
    { id: 'dismiss-all', label: 'Dismiss All Deadlines', icon: 'done_all' },
  ];

  ngAfterViewInit() {
    this.events.set(
      RAW_EVENTS.map((e) => {
        const meta = e.data as EventMeta;
        const tpl =
          meta.type === 'meeting'
            ? this.meetingTpl
            : meta.type === 'task'
              ? this.taskTpl
              : this.deadlineTpl;
        return { ...e, sidebarTemplate: tpl };
      }),
    );
  }

  onAction(action: CalendarAction) {
    if (action.id === 'dismiss-all') {
      this.events.update((evs) =>
        evs.map((e) => {
          const meta = e.data as EventMeta;
          if (meta.type === 'deadline') {
            return { ...e, data: { ...meta, dismissed: true }, color: '#9e9e9e' };
          }
          return e;
        }),
      );
    }
  }

  dismiss(event: CalendarEvent) {
    this.events.update((evs) =>
      evs.map((e) =>
        e.id === event.id
          ? { ...e, data: { ...(e.data as DeadlineMeta), dismissed: true }, color: '#9e9e9e' }
          : e,
      ),
    );
  }

  snooze(event: CalendarEvent) {
    this.events.update((evs) =>
      evs.map((e) =>
        e.id === event.id
          ? { ...e, start: e.start.plus({ days: 1 }), end: e.end.plus({ days: 1 }) }
          : e,
      ),
    );
  }

  daysUntil(event: CalendarEvent): string {
    const diff = Math.ceil(event.start.diffNow('days').days);
    if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} overdue`;
    if (diff === 0) return 'Due today';
    return `${diff} day${diff !== 1 ? 's' : ''} remaining`;
  }

  doneCount(event: CalendarEvent): number {
    return (event.data as TaskMeta).checklist.filter((c) => c.done).length;
  }

  asMeeting(event: CalendarEvent): MeetingMeta {
    return event.data as MeetingMeta;
  }
  asTask(event: CalendarEvent): TaskMeta {
    return event.data as TaskMeta;
  }
  asDeadline(event: CalendarEvent): DeadlineMeta {
    return event.data as DeadlineMeta;
  }
}
