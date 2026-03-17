import {
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  OnInit,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgStyle, NgTemplateOutlet } from '@angular/common';
import { DateTime } from 'luxon';
import { CalendarWeekLayout } from './layout/week/calendar-week-layout';
import { CalendarMonthLayout } from './layout/month/calendar-month-layout';
import { CalendarDayLayout } from './layout/day/calendar-day-layout';
import { CalendarEvent } from './models/calendar-event';
import { CalendarSource } from './models/calendar-source';
import { PositionedEvent } from './models/positioned-event';
import { CALENDAR_I18N } from './models/calendar-i18n';
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
} from './components/add-edit-event-dialog/add-edit-event-dialog.component';
import { ColorPickerComponent } from './components/color-picker/color-picker.component';
import { EventTimeRangeComponent } from './components/event-time-range/event-time-range.component';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CalendarAction } from './models/calendar-action';
import { EVENT_MOCK } from './testing/event-mock';

import {
  EVENT_EDGE_PADDING_LEFT,
  EVENT_EDGE_PADDING_RIGHT,
  ROW_HEIGHT_PX,
} from './layout/constants';

const ISO_FORMAT = "yyyy-MM-dd'T'HH:mm";

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  host: {
    style: 'display:flex;width:100%;height:100%;',
    '[class]': 'view()',
    '[style.--row-height]': 'rowHeight() + "px"',
  },
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatIconModule,
    MatDialogModule,
    MatMenuModule,
    MatDividerModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    NgTemplateOutlet,
    NgStyle,
    ColorPickerComponent,
    EventTimeRangeComponent,
  ],
})
export class CalendarComponent implements OnInit {
  readonly i18n = inject(CALENDAR_I18N);

  // ── Inputs ────────────────────────────────────────────────────────────────
  /** External events. When provided, the component emits changes via outputs instead of owning its state. */
  eventsInput = input<CalendarEvent[] | undefined>(undefined, { alias: 'events' });
  /**
   * Multiple named event sources. When provided, a toggle chip is shown per
   * source in the toolbar and only visible sources contribute events to the grid.
   * Takes precedence over the flat `[events]` input.
   */
  calendars = input<CalendarSource[] | undefined>(undefined);
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
  /**
   * Actions shown in the calendar-wide `⋮` menu in the toolbar.
   * No button is rendered when the array is empty.
   */
  actions = input<CalendarAction[]>([]);
  /**
   * Maximum number of side-by-side event columns rendered per day in week view.
   * When more events overlap at the same time, the extras collapse into a
   * "+N more" badge. Increase this when using `[calendars]` with many sources.
   * Default: 3.
   */
  maxOverlapColumns = input(3);

  // ── Outputs ───────────────────────────────────────────────────────────────
  /** Emitted when the user saves a new event. */
  eventAdded = output<CalendarEvent>();
  /** Emitted when the user saves changes to an existing event. */
  eventUpdated = output<CalendarEvent>();
  /** Emitted with the id of the deleted event. */
  eventDeleted = output<string>();
  /** Emitted when an event is selected via click (only when detailsTemplate is set). */
  eventSelected = output<CalendarEvent>();
  /** Emitted when the user clicks an action in the calendar toolbar menu. */
  actionTriggered = output<CalendarAction>();

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
  weekLayout(weekDate: DateTime) {
    this.view.set('week');
    this.date.set(weekDate);
    this.scrollToBusinessHours();
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

    // Build edit draft for built-in panel
    if (!this.detailsTemplate()) {
      this._editingSourceId = sourceId;
      this.editDraft.set(
        this.toEventData(realEvent.title, realEvent.start, realEvent.end, realEvent.color),
      );
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
      this._editingSourceId = event.id;
      this.editDraft.set(this.toEventData(event.title, event.start, event.end, event.color));
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
      const scrollContainer = document.querySelector('.scroll-container') as HTMLElement;
      if (scrollContainer) {
        // 7:30 AM = row 30 (7.5 hours * 4 rows per hour)
        scrollContainer.scrollTop = 7.5 * 4 * this.rowHeight();
      }
    }, 100);
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
  /** Height in pixels of one 15-minute grid row. Override via the `rowHeight` input. */
  rowHeight = input(ROW_HEIGHT_PX);
  hoveredEventId = signal<string | null>(null);
  hoveredTimeSlot = signal<{ day: DateTime; row: number } | null>(null);
  hoveredWeekIndex = signal<number | null>(null);
  isTimeView = computed(() => this.view() !== 'month');

  // ── Drag-to-create state ─────────────────────────────────────────────────
  /** Selection rectangle currently being dragged in week/day view. */
  timeDragSelection = signal<{
    startDay: DateTime;
    startRow: number;
    startDayIdx: number;
    endDay: DateTime;
    endRow: number;
    endDayIdx: number;
  } | null>(null);
  /** Month-view drag: the cell where the drag started. */
  monthDragAnchor = signal<DateTime | null>(null);
  /** Month-view drag: the cell currently under the pointer. */
  monthDragEnd = signal<DateTime | null>(null);

  private _timeDragAnchor: { day: DateTime; row: number; dayIndex: number } | null = null;
  private _isDragging = false;
  private _suppressNextClick = false;
  private _isMonthDragging = false;

  /**
   * Per-column drag highlight for time views.
   * Returns an array indexed by day column (0-6 in week view, always [0] in day view).
   * Each entry is `{ top, height }` in pixels when the column is covered by the drag,
   * or `null` when it is not.
   *
   * For cross-column drags the selection is a staircase shape:
   *   - start column: from anchor row → bottom of day
   *   - middle columns: full day
   *   - end column: top of day → end row
   */
  timeDragStripes = computed((): Array<{ top: number; height: number } | null> => {
    const sel = this.timeDragSelection();
    const dayCount = this.view() === 'day' ? 1 : 7;
    if (!sel) return Array(dayCount).fill(null);

    const MAX_ROW = 95; // last 15-min slot of the day

    // Same column — simple vertical range
    if (sel.startDayIdx === sel.endDayIdx) {
      const top = Math.min(sel.startRow, sel.endRow);
      const bot = Math.max(sel.startRow, sel.endRow);
      return Array.from({ length: dayCount }, (_, i) =>
        i === sel.startDayIdx
          ? { top: top * this.rowHeight(), height: (bot - top + 1) * this.rowHeight() }
          : null,
      );
    }

    // Cross-column: determine chronological start and end columns
    const [startDayIdx, startRow, endDayIdx, endRow] =
      sel.startDayIdx < sel.endDayIdx
        ? [sel.startDayIdx, sel.startRow, sel.endDayIdx, sel.endRow]
        : [sel.endDayIdx, sel.endRow, sel.startDayIdx, sel.startRow];

    return Array.from({ length: dayCount }, (_, i) => {
      if (i < startDayIdx || i > endDayIdx) return null;
      if (i === startDayIdx)
        return {
          top: startRow * this.rowHeight(),
          height: (MAX_ROW - startRow + 1) * this.rowHeight(),
        };
      if (i === endDayIdx) return { top: 0, height: (endRow + 1) * this.rowHeight() };
      return { top: 0, height: (MAX_ROW + 1) * this.rowHeight() }; // middle columns: full day
    });
  });

  /** Set of day-start millis covered by the current month-view drag selection. */
  monthSelectedDays = computed((): Set<number> => {
    const anchor = this.monthDragAnchor();
    const end = this.monthDragEnd();
    if (!anchor || !end) return new Set();
    const from = anchor < end ? anchor : end;
    const to = anchor < end ? end : anchor;
    const set = new Set<number>();
    let cur = from.startOf('day');
    const last = to.startOf('day');
    while (cur <= last) {
      set.add(cur.toMillis());
      cur = cur.plus({ days: 1 });
    }
    return set;
  });

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

  /**
   * Set of calendar source IDs the user has hidden.
   * All sources are visible by default; toggling adds/removes from this set.
   */
  private _disabledCalendars = signal<Set<string>>(new Set());

  /** Active events: multi-calendar sources take precedence, then external flat input, then internal store. */
  events = computed(() => {
    const sources = this.calendars();
    if (sources) {
      const disabled = this._disabledCalendars();
      return sources.filter((s) => !disabled.has(s.id)).flatMap((s) => s.events);
    }
    return this.eventsInput() ?? this._ownEvents();
  });

  /** Toggle a calendar source on/off. */
  toggleCalendar(id: string): void {
    this._disabledCalendars.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Returns true when the source with `id` is currently visible. */
  isCalendarEnabled(id: string): boolean {
    return !this._disabledCalendars().has(id);
  }

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
        this.positionedEvents.set(
          this.weekLayoutEngine.layoutWeek(events, week, this.maxOverlapColumns()),
        );
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

  onDayMouseDown(event: MouseEvent, day: DateTime, dayIndex: number) {
    if (this.readonly()) return;
    if (this.isTimeView()) {
      const el = event.currentTarget as HTMLElement;
      const row = Math.floor((event.offsetY / el.clientHeight) * 96);
      this._timeDragAnchor = { day, row, dayIndex };
      this._isDragging = false;
      this.timeDragSelection.set(null);
    } else {
      this._isMonthDragging = true;
      this.monthDragAnchor.set(day);
      this.monthDragEnd.set(day);
    }
    // Prevent text selection while dragging
    event.preventDefault();
  }

  onDayMouseMove(event: MouseEvent, day: DateTime, dayIndex: number) {
    const el = event.currentTarget as HTMLElement;
    const row = Math.floor((event.offsetY / el.clientHeight) * 96);
    if (!this._isDragging) this.hoveredTimeSlot.set({ day, row });

    if (!this._timeDragAnchor) return;
    const anchor = this._timeDragAnchor;
    if (!this._isDragging && (row !== anchor.row || dayIndex !== anchor.dayIndex)) {
      this._isDragging = true;
    }
    if (this._isDragging) {
      this.timeDragSelection.set({
        startDay: anchor.day,
        startRow: anchor.row,
        startDayIdx: anchor.dayIndex,
        endDay: day,
        endRow: row,
        endDayIdx: dayIndex,
      });
    }
  }

  onDayMouseEnter(day: DateTime) {
    if (this._isMonthDragging) {
      this.monthDragEnd.set(day);
    }
  }

  onDayMouseUp(event: MouseEvent, day: DateTime, dayIndex: number) {
    if (this.isTimeView()) {
      if (this._isDragging && this._timeDragAnchor) {
        const el = event.currentTarget as HTMLElement;
        const endRow = Math.floor((event.offsetY / el.clientHeight) * 96);
        const anchor = this._timeDragAnchor;
        const startDayIdx = Math.min(anchor.dayIndex, dayIndex);
        const endDayIdx = Math.max(anchor.dayIndex, dayIndex);
        const week = this.weeks()[0];
        const days = this.view() === 'day' ? [this.date()] : week;
        const startDay = days[startDayIdx] ?? anchor.day;
        const endDay = days[endDayIdx] ?? day;
        const startRow = anchor.dayIndex <= dayIndex ? anchor.row : endRow;
        const endRowFinal = anchor.dayIndex <= dayIndex ? endRow : anchor.row;
        const [chronStart, chronEnd] =
          startRow <= endRowFinal ? [startRow, endRowFinal] : [endRowFinal, startRow];
        const start = this.rowToDateTime(startDay, chronStart);
        const end = this.rowToDateTime(endDay, chronEnd + 1);
        this._suppressNextClick = true;
        this.openAddDialog(start, end);
      }
      this._timeDragAnchor = null;
      this._isDragging = false;
      this.timeDragSelection.set(null);
    } else {
      if (this._isMonthDragging) {
        const anchor = this.monthDragAnchor();
        const endDay = this.monthDragEnd();
        if (anchor && endDay && !anchor.hasSame(endDay, 'day')) {
          const from = anchor < endDay ? anchor : endDay;
          const to = anchor < endDay ? endDay : anchor;
          this._suppressNextClick = true;
          this.openAddDialog(from.startOf('day'), to.endOf('day'));
        }
        this._isMonthDragging = false;
        this.monthDragAnchor.set(null);
        this.monthDragEnd.set(null);
      }
    }
  }

  onDayClick(day: DateTime) {
    if (this._suppressNextClick) {
      this._suppressNextClick = false;
      return;
    }
    if (this.isTimeView()) {
      if (!this.readonly()) this.addEvent(day);
    } else {
      this.dayLayout(day);
    }
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp() {
    // Safety net: if mouse is released outside the calendar grid, cancel any drag.
    if (this._timeDragAnchor || this._isDragging) {
      this._timeDragAnchor = null;
      this._isDragging = false;
      this.timeDragSelection.set(null);
    }
    if (this._isMonthDragging) {
      this._isMonthDragging = false;
      this.monthDragAnchor.set(null);
      this.monthDragEnd.set(null);
    }
  }

  onDayMouseLeave() {
    this.hoveredTimeSlot.set(null);
  }

  /** Fires `actionTriggered` for the given calendar-wide action. */
  onCalendarAction(action: CalendarAction, domEvent: MouseEvent): void {
    domEvent.stopPropagation();
    this.actionTriggered.emit(action);
  }

  rowToDateTime(day: DateTime, row: number): DateTime {
    const hour = Math.floor(row / 4);
    const minute = (row % 4) * 15;
    return day.set({ hour, minute, second: 0, millisecond: 0 });
  }

  addEvent(day?: DateTime) {
    const start = this.resolveNewEventStart(day);
    const end = start.plus({ hours: 1 });
    this.openAddDialog(start, end);
  }

  private openAddDialog(start: DateTime, end: DateTime) {
    const dialogRef = this.dialog.open(AddEditEventDialogComponent, {
      data: {
        mode: 'add',
        event: this.toEventData('', start, end, '#1976d2'),
      } as EventDialogData,
    });
    dialogRef.afterClosed().subscribe((result) => this.handleAddResult(result));
  }

  private resolveNewEventStart(day?: DateTime): DateTime {
    if (day) return day.set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
    return DateTime.now().startOf('hour').set({ hour: 10 });
  }

  private handleAddResult(result: { event: EventData } | null): void {
    if (!result) return;
    const newEvent = this.toCalendarEvent(crypto.randomUUID(), result.event);
    this._ownEvents.update((events) => [...events, newEvent]);
    this.eventAdded.emit(newEvent);
  }

  eventStyles(event: PositionedEvent): Record<string, string> {
    if (this.isTimeView()) {
      const padL = event.metadata.paddingLeft ?? EVENT_EDGE_PADDING_LEFT;
      const padR = event.metadata.paddingRight ?? EVENT_EDGE_PADDING_RIGHT;
      const rowPct = event.layout.row * (100 / 96);
      const spanPct = (event.metadata.rowSpan || 1) * (100 / 96);
      return {
        '--event-top': event.layout.row * this.rowHeight() + 'px',
        left: `calc(${event.layout.left}% + ${padL}px)`,
        width: `calc(${event.layout.width}% - ${padL + padR}px)`,
        top: `calc(${rowPct}% + 2px)`,
        height: `calc(${spanPct}% - 4px)`,
        'background-color': event.color,
      };
    }
    return {
      left: `calc(${event.layout.left}% + 4px)`,
      width: `calc(${event.layout.width}% - 8px)`,
      top: event.sizing.topPercent + '%',
      height: event.sizing.heightPercentMonth + '%',
      'background-color': event.color,
    };
  }

  private formatIso(dt: DateTime): string {
    return dt.toFormat(ISO_FORMAT);
  }

  private toEventData(title: string, start: DateTime, end: DateTime, color: string): EventData {
    return { title, start: this.formatIso(start), end: this.formatIso(end), color };
  }

  private toCalendarEvent(id: string, data: EventData): CalendarEvent {
    return {
      id,
      title: data.title,
      start: DateTime.fromISO(data.start),
      end: DateTime.fromISO(data.end),
      color: data.color,
    };
  }
}
