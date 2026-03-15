import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DateTime } from 'luxon';
import { CalendarWeekLayout } from './calendar-week-layout';
import { CalendarMonthLayout } from './calendar-month-layout';
import { CalendarDayLayout } from './calendar-day-layout';
import { CalendarEvent, PositionedEvent } from './calendar-event';
import { CALENDAR_I18N } from './calendar-i18n';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import {
  AddEditEventDialogComponent,
  EventData,
  EventDialogData,
} from './add-edit-event-dialog.component';
import { ColorPickerComponent } from './color-picker.component';
import { EventTimeRangeComponent } from './event-time-range.component';
import { EVENT_MOCK } from './event-mock';

export type EventTypes = 'SETUP' | 'WORK' | 'BREAK' | 'MEETING' | 'OTHER' | 'SHIFT';
export type EVENT_COLORS = {
  [key in EventTypes]: string;
};
export const EVENT_COLORS: EVENT_COLORS = {
  SETUP: '#1976d2',
  WORK: '#388e3c',
  BREAK: '#fbc02d',
  MEETING: '#d32f2f',
  OTHER: '#7b1fa2',
  SHIFT: '#00796b',
};

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  host: { style: 'display:flex;width:100%;height:100%;' },
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatDialogModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    NgTemplateOutlet,
    ColorPickerComponent,
    EventTimeRangeComponent,
  ],
})
export class CalendarComponent implements OnInit {
  readonly i18n = inject(CALENDAR_I18N);

  // ── Inputs ────────────────────────────────────────────────────────────────
  /** External events. When provided, the component emits changes via outputs instead of owning its state. */
  eventsInput = input<CalendarEvent[] | undefined>(undefined, { alias: 'events' });
  /** Disables all editing interactions (no dialog, no FAB). */
  readonly = input(false);
  /** Show or hide the floating add button. Default: true. */
  showFab = input(true);
  /** Show or hide the right-hand event sidebar. Default: true. */
  showSidebar = input(true);
  /** Optional template rendered in the sidebar when an event is selected.
   *  Context: `{ $implicit: CalendarEvent }`. When not provided the sidebar is hidden. */
  detailsTemplate = input<TemplateRef<{ $implicit: CalendarEvent }> | null>(null);
  /** Show or hide the Month/Week/Day view toggle. Default: true. */
  showViewToggle = input(true);
  /** Initial view on mount. Default: 'month'. */
  initialView = input<'month' | 'week' | 'day'>('month');
  /** Initial date on mount. Default: today. */
  initialDate = input<DateTime>(DateTime.now());

  // ── Outputs ───────────────────────────────────────────────────────────────
  /** Emitted when the user saves a new event. */
  eventAdded = output<CalendarEvent>();
  /** Emitted when the user saves changes to an existing event. */
  eventUpdated = output<CalendarEvent>();
  /** Emitted with the id of the deleted event. */
  eventDeleted = output<string>();
  /** Emitted when an event is selected via click (only when detailsTemplate is set). */
  eventSelected = output<CalendarEvent>();

  /** The event currently shown in the details panel. */
  selectedEvent = signal<CalendarEvent | null>(null);
  /** Working copy of the selected event for the inline edit form. */
  editDraft = signal<EventData | null>(null);
  /** Tracks time-range validity so the Save button can be enabled/disabled. */
  editTimeRangeValid = signal(true);
  private _editingSourceId: string | null = null;

  monthLayout() {
    this.view.set('month');
    this.date.set(this.date().startOf('month'));
  }
  onWeekNumberClick(event: MouseEvent, weekFirstDay: any) {
    event.stopPropagation();
    this.weekLayout(weekFirstDay);
  }
  weekLayout(weekDateOrIndex: any) {
    this.view.set('week');
    // If it's a DateTime object, use it directly. Otherwise, calculate from current weeks
    const weekDate = weekDateOrIndex?.toJSDate
      ? weekDateOrIndex
      : this.weeks()[weekDateOrIndex]?.[0];
    if (weekDate) {
      this.date.set(weekDate);
      this.scrollToBusinessHours();
    }
  }

  dayLayout(date: DateTime) {
    this.view.set('day');
    this.date.set(date.startOf('day'));
    this.scrollToBusinessHours();
  }

  onEventClick(event: PositionedEvent) {
    if (event.metadata.hiddenCount) {
      this.dayLayout(event.start);
      return;
    }
    const sourceId = event.metadata.sourceId ?? event.id;
    const realEvent = (this.events().find((e) => e.id === sourceId) ?? event) as CalendarEvent;
    this.selectedEvent.set(realEvent);
    this.eventSelected.emit(realEvent);

    // Build edit draft for built-in panel (skipped when in readonly mode)
    if (!this.readonly() && !this.detailsTemplate()) {
      const toISO = (dt: DateTime) => dt.toFormat("yyyy-MM-dd'T'HH:mm");
      this._editingSourceId = sourceId;
      this.editDraft.set({
        title: realEvent.title,
        start: toISO(realEvent.start),
        end: toISO(realEvent.end),
        color: realEvent.color,
      });
    }
  }

  setDraftField(field: keyof EventData, value: string) {
    this.editDraft.update((d) => (d ? { ...d, [field]: value } : d));
  }

  onSaveEdit() {
    const draft = this.editDraft();
    if (!draft || !this._editingSourceId) return;
    const updated: CalendarEvent = {
      id: this._editingSourceId,
      title: draft.title,
      start: DateTime.fromISO(draft.start),
      end: DateTime.fromISO(draft.end),
      color: draft.color,
    };
    const id = this._editingSourceId;
    this._ownEvents.update((events) => events.map((e) => (e.id === id ? updated : e)));
    this.eventUpdated.emit(updated);
    // Keep the sidebar open — just refresh selectedEvent to reflect saved values.
    this.selectedEvent.set(updated);
  }

  onDeleteEdit() {
    if (!this._editingSourceId) return;
    const id = this._editingSourceId;
    this._ownEvents.update((events) => events.filter((e) => e.id !== id));
    this.eventDeleted.emit(id);
    this.closeEditPanel();
  }

  closeEditPanel() {
    this.selectedEvent.set(null);
    this.editDraft.set(null);
    this._editingSourceId = null;
  }

  selectEvent(event: CalendarEvent) {
    this.selectedEvent.set(event);
    this.eventSelected.emit(event);
    if (!this.readonly() && !this.detailsTemplate()) {
      const toISO = (dt: DateTime) => dt.toFormat("yyyy-MM-dd'T'HH:mm");
      this._editingSourceId = event.id;
      this.editDraft.set({
        title: event.title,
        start: toISO(event.start),
        end: toISO(event.end),
        color: event.color,
      });
    }
  }

  selectPrevEvent() {
    const all = this.visibleEvents();
    if (!all.length) return;
    const idx = all.findIndex((e) => e.id === this.selectedEvent()?.id);
    const prev = all[(idx - 1 + all.length) % all.length];
    this.selectEvent(prev);
  }

  selectNextEvent() {
    const all = this.visibleEvents();
    if (!all.length) return;
    const idx = all.findIndex((e) => e.id === this.selectedEvent()?.id);
    const next = all[(idx + 1) % all.length];
    this.selectEvent(next);
  }

  onScroll(e: Event): void {
    const el = e.target as HTMLElement;
    el.style.setProperty('--scroll-top', el.scrollTop + 'px');
  }

  private scrollToBusinessHours() {
    setTimeout(() => {
      const scrollContainer = document.querySelector(
        '.scroll-container.week-view, .scroll-container.day-view',
      ) as HTMLElement;
      if (scrollContainer) {
        // 7:30 AM = row 30 (7.5 hours * 4 rows per hour)
        // Each row is 30px, so scroll to: 30 * 30 = 900px
        scrollContainer.scrollTop = 7.5 * 4 * 30;
      }
    }, 100);
  }
  removeEvent(_t56: PositionedEvent) {
    const sourceId = (_t56.metadata?.sourceId as string | undefined) ?? _t56.id;
    this._ownEvents.update((events) => events.filter((e) => e.id !== sourceId));
    this.eventDeleted.emit(sourceId);
  }
  date = signal(DateTime.now());

  weeks = signal<Array<Array<DateTime>>>([]);
  positionedEvents = signal<Array<PositionedEvent>>([]);

  /**
   * Unique source CalendarEvents currently rendered in the visible view.
   * Multi-day spans appear only once; order follows layout order.
   */
  visibleEvents = computed(() => {
    const seenIds = new Set<string>();
    const result: CalendarEvent[] = [];
    for (const pe of this.positionedEvents()) {
      const id = (pe.metadata?.sourceId as string | undefined) ?? pe.id;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        const source = this.events().find((e) => e.id === id);
        if (source) result.push(source);
      }
    }
    return result;
  });
  hoveredEventId = signal<string | null>(null);
  hoveredTimeSlot = signal<{ day: DateTime; row: number } | null>(null);
  weekHeight = computed(() => 100 / this.weeks().length);

  // Generate hourly time markers for week view (0-24)
  hourMarkers = computed(() => {
    return Array.from({ length: 25 }, (_, i) => i);
  });

  // Generate 15-minute interval rows for week view (between hour markers)
  minuteMarkers = computed(() => {
    const markers: number[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let interval = 1; interval <= 3; interval++) {
        markers.push(hour * 4 + interval + 1); // Rows 2, 3, 4, 6, 7, 8, etc.
      }
    }
    return markers;
  });

  weekLayoutEngine = new CalendarWeekLayout();
  monthLayoutEngine = new CalendarMonthLayout();
  dayLayoutEngine = new CalendarDayLayout();

  view = signal<'month' | 'week' | 'day'>('month');

  get weekdays() {
    return this.i18n.weekdays;
  }

  /** Internal event store used in standalone mode (no [events] input bound). */
  private _ownEvents = signal<CalendarEvent[]>(EVENT_MOCK);
  /** Active events: external input takes precedence over internal state. */
  events = computed(() => this.eventsInput() ?? this._ownEvents());

  constructor(private dialog: MatDialog) {
    effect(() => {
      const date = this.date();
      const view = this.view();
      if (view === 'week') {
        this.weeks.set([this.weekLayoutEngine.generateWeek(date)]);
        return;
      }
      if (view === 'day') {
        this.weeks.set([[date]]);
        return;
      }
      this.weeks.set(this.monthLayoutEngine.generateMonth(date));
    });
    effect(() => {
      const events = this.events();
      const view = this.view();
      if (view === 'week') {
        const week = this.weeks()[0];
        this.positionedEvents.set(this.weekLayoutEngine.layoutWeek(events, week));
        return;
      }
      if (view === 'day') {
        this.positionedEvents.set(this.dayLayoutEngine.layoutDay(events, this.date()));
        return;
      }
      this.positionedEvents.set(this.monthLayoutEngine.layoutMonth(events, this.weeks()));
    });
  }

  ngOnInit(): void {
    const v = this.initialView();
    const d = this.initialDate();
    this.date.set(d);
    if (v === 'week') this.weekLayout(d);
    else if (v === 'day') this.dayLayout(d);
  }

  previous() {
    this.updateDate('decrease');
  }

  next() {
    this.updateDate('increase');
  }

  updateDate(crement: 'increase' | 'decrease') {
    switch (this.view()) {
      case 'month':
        this.date.update((d) => d.plus({ months: crement === 'increase' ? 1 : -1 }));
        break;
      case 'week':
        this.date.update((d) => d.plus({ weeks: crement === 'increase' ? 1 : -1 }));
        break;
      case 'day':
        this.date.update((d) => d.plus({ days: crement === 'increase' ? 1 : -1 }));
        break;
    }
  }

  setView(v: 'month' | 'week' | 'day') {
    if (v === 'month') this.monthLayout();
    else if (v === 'week') this.weekLayout(this.date());
    else this.dayLayout(this.date());
  }

  hasEventOnDay(day: DateTime): boolean {
    return this.positionedEvents().some((event) => {
      const weekIndex = this.weeks().findIndex((week) => week.some((d) => d.hasSame(day, 'day')));
      if (weekIndex !== event.layout.weekIndex) return false;
      const dayIndex = this.weeks()[weekIndex].findIndex((d) => d.hasSame(day, 'day'));
      const col = dayIndex + 1;
      return col >= event.layout.colStart && col < event.layout.colStart + event.layout.colSpan;
    });
  }

  onDayMouseMove(event: MouseEvent, day: DateTime) {
    const el = event.currentTarget as HTMLElement;
    const row = Math.floor((event.offsetY / el.clientHeight) * 96);
    this.hoveredTimeSlot.set({ day, row });
  }

  onDayMouseLeave() {
    this.hoveredTimeSlot.set(null);
  }

  rowToDateTime(day: DateTime, row: number): DateTime {
    const hour = Math.floor(row / 4);
    const minute = (row % 4) * 15;
    return day.set({ hour, minute, second: 0, millisecond: 0 });
  }

  addEvent(day?: DateTime) {
    const slot = this.hoveredTimeSlot();
    let start: DateTime;
    if (slot && day) {
      start = this.rowToDateTime(day, slot.row);
    } else if (day) {
      start = day.set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
    } else {
      start = DateTime.now().startOf('hour').set({ hour: 10 });
    }
    const end = start.plus({ hours: 1 });
    const toISO = (dt: DateTime) => dt.toFormat("yyyy-MM-dd'T'HH:mm");
    const dialogRef = this.dialog.open(AddEditEventDialogComponent, {
      data: {
        mode: 'add',
        event: {
          title: '',
          start: toISO(start),
          end: toISO(end),
          color: '#1976d2',
        } as EventData,
      } as EventDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const newEvent: CalendarEvent = {
          id: crypto.randomUUID(),
          title: result.event.title,
          start: DateTime.fromISO(result.event.start),
          end: DateTime.fromISO(result.event.end),
          color: result.event.color,
        };
        this._ownEvents.update((events) => [...events, newEvent]);
        this.eventAdded.emit(newEvent);
      }
    });
  }

  openEditEventDialog(event: PositionedEvent) {
    if (this.readonly()) return;
    const realEvent = {
      ...event,
      start: event.metadata.eventStart || event.start,
      end: event.metadata.eventEnd || event.end,
    };
    const dialogRef = this.dialog.open(AddEditEventDialogComponent, {
      data: {
        mode: 'edit',
        event: realEvent as any as EventData,
      } as EventDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.delete) {
          const sourceId = event.metadata.sourceId ?? event.id;
          this._ownEvents.update((events) => events.filter((e) => e.id !== sourceId));
          this.eventDeleted.emit(sourceId);
        } else {
          const sourceId = event.metadata.sourceId ?? event.id;
          const updatedEvent: CalendarEvent = {
            id: sourceId,
            title: result.event.title,
            start: DateTime.fromISO(result.event.start),
            end: DateTime.fromISO(result.event.end),
            color: result.event.color,
          };
          this._ownEvents.update((events) => {
            const index = events.findIndex((e) => e.id === sourceId);
            if (index !== -1) events[index] = updatedEvent;
            return [...events];
          });
          this.eventUpdated.emit(updatedEvent);
        }
      }
    });
  }

  dayFraction(date: DateTime) {
    return (date.hour * 60 + date.minute) / (24 * 60);
  }
  durationFraction(start: DateTime, end: DateTime) {
    return end.diff(start, 'minutes').minutes / (24 * 60);
  }
}
