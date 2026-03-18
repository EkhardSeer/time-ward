import { DateTime } from 'luxon';
import { CalendarEvent } from '../../models/calendar-event';
import { PositionedEvent } from '../../models/positioned-event';
import { CalendarLayoutBase } from '../base/calendar-layout-base';

import { RowState } from './types/row-state';
import { MonthLayoutContext } from './types/month-layout-context';
import { EventGridRange } from './types/event-grid-range';
import { WeekSegment } from './types/week-segment';

/**
 * Layout engine for the month calendar view.
 *
 * Positions events on a grid of week-rows × 7-day columns.
 * Multi-day and multi-week events are split into one positioned segment
 * per week they span. Collision detection uses time-interval overlap
 * (not just day occupancy) so events on the same day but at different
 * times can share a visual row.
 *
 * Up to `MAX_VISIBLE_EVENTS_PER_ROW` events are rendered per day;
 * additional events are collapsed into an overflow "+N more" badge.
 */
export class CalendarMonthLayout extends CalendarLayoutBase {
  /** Maximum visible events per day cell before showing an overflow badge. */
  private readonly MAX_VISIBLE_EVENTS_PER_ROW = 3;
  /** Fraction of each week row reserved for the day-number chip (keeps events below the number). */
  private readonly MONTH_DAY_HEADER_FRACTION = 0.2;
  /**
   * Minimum rendered width for a single-day event, as a fraction of one day column.
   * 1 = always fill the full day column (ensures short events are always readable).
   */
  private readonly MIN_SINGLE_DAY_WIDTH_FRACTION = 1;
  /**
   * Event height as a fraction of its row slot — the remainder becomes the inter-event gap.
   * 0.85 leaves a small 15% gap between stacked events.
   */
  private readonly EVENT_HEIGHT_FRACTION = 0.85;

  // ========== Generator Functions ==========

  /**
   * Generate a month grid as an array of weeks, where each week is an array of 7 days.
   * Pads weeks with the previous month's last days and next month's first days to fill 7-day weeks.
   */
  generateMonth(date: DateTime): DateTime[][] {
    const startOfMonth = date.startOf('month');
    const endOfMonth = date.endOf('month');

    // Start from the beginning of the week containing the 1st of the month
    let current = startOfMonth.startOf('week');

    const weeks: DateTime[][] = [];

    while (current <= endOfMonth) {
      const week = Array.from({ length: 7 }, (_, i) => current.plus({ days: i }));
      weeks.push(week);
      current = current.plus({ weeks: 1 });
    }

    return weeks;
  }

  // ========== Layout Functions ==========

  /** Layout events for month view with collision detection. */
  layoutMonth(events: CalendarEvent[], weeks: DateTime[][]): PositionedEvent[] {
    const ctx = this.initContext(weeks);
    for (const event of events) {
      this.processEvent(event, ctx);
    }
    this.emitOverflowBadges(ctx);
    return ctx.positioned;
  }

  private initContext(weeks: DateTime[][]): MonthLayoutContext {
    const weekHeightPercent = 100 / weeks.length;
    const dayHeaderHeightPercent = weekHeightPercent * this.MONTH_DAY_HEADER_FRACTION;
    const eventRowHeightPercent = (weekHeightPercent * (1 - this.MONTH_DAY_HEADER_FRACTION)) / 4;
    return {
      weeks,
      weekHeightPercent,
      dayHeaderHeightPercent,
      eventRowHeightPercent,
      dayWidth: 100 / 7,
      rowsPerDay: weeks.map(() =>
        Array.from({ length: 7 }, () =>
          Array.from({ length: 10 }, () => ({
            intervals: [] as Array<{ start: DateTime; end: DateTime }>,
          })),
        ),
      ),
      hiddenEventsMap: new Map(),
      positioned: [],
    };
  }

  private processEvent(event: CalendarEvent, ctx: MonthLayoutContext): void {
    const eventStart = event.start.startOf('day');
    const eventEnd = event.end.equals(event.end.startOf('day'))
      ? event.end.minus({ days: 1 }).startOf('day')
      : event.end.startOf('day');

    const range = this.findEventGridRange(eventStart, eventEnd, ctx.weeks);
    if (!range) return;

    const segments = this.buildWeekSegments(range);
    const rowPerWeek = this.assignRowsPerWeek(event, segments, ctx);
    this.recordOccupiedIntervals(event, segments, rowPerWeek, ctx);

    for (const seg of segments) {
      this.renderSegment(event, seg, range, rowPerWeek, ctx);
    }
  }

  private findEventGridRange(
    eventStart: DateTime,
    eventEnd: DateTime,
    weeks: DateTime[][],
  ): EventGridRange | null {
    const firstVisibleDay = weeks[0][0].startOf('day');
    const lastVisibleDay = weeks[weeks.length - 1][6].startOf('day');

    if (
      eventEnd.toMillis() < firstVisibleDay.toMillis() ||
      eventStart.toMillis() > lastVisibleDay.toMillis()
    ) {
      return null;
    }

    let startWeekIndex = -1,
      startDayIndex = -1;
    let endWeekIndex = -1,
      endDayIndex = -1;

    for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const cellDate = weeks[weekIdx][dayIdx].startOf('day');
        if (cellDate.equals(eventStart)) {
          startWeekIndex = weekIdx;
          startDayIndex = dayIdx;
        }
        if (cellDate.equals(eventEnd)) {
          endWeekIndex = weekIdx;
          endDayIndex = dayIdx;
        }
      }
    }

    if (startWeekIndex === -1) {
      startWeekIndex = 0;
      startDayIndex = 0;
    }
    if (endWeekIndex === -1) {
      endWeekIndex = weeks.length - 1;
      endDayIndex = 6;
    }

    return {
      startWeekIndex,
      startDayIndex,
      endWeekIndex,
      endDayIndex,
      eventStartsBeforeVisible: eventStart.toMillis() < firstVisibleDay.toMillis(),
      eventEndsAfterVisible: eventEnd.toMillis() > lastVisibleDay.toMillis(),
    };
  }

  private buildWeekSegments(range: EventGridRange): WeekSegment[] {
    const {
      startWeekIndex,
      startDayIndex,
      endWeekIndex,
      endDayIndex,
      eventStartsBeforeVisible,
      eventEndsAfterVisible,
    } = range;

    if (endWeekIndex === startWeekIndex && !eventStartsBeforeVisible && !eventEndsAfterVisible) {
      return [
        { weekIndex: startWeekIndex, firstDayIndex: startDayIndex, lastDayIndex: endDayIndex },
      ];
    }

    const segments: WeekSegment[] = [];
    for (let wIdx = startWeekIndex; wIdx <= endWeekIndex; wIdx++) {
      segments.push({
        weekIndex: wIdx,
        firstDayIndex: wIdx === startWeekIndex ? startDayIndex : 0,
        lastDayIndex: wIdx === endWeekIndex ? endDayIndex : 6,
      });
    }
    return segments;
  }

  private assignRowsPerWeek(
    event: CalendarEvent,
    segments: WeekSegment[],
    ctx: MonthLayoutContext,
  ): Map<number, number> {
    const rowPerWeek = new Map<number, number>();

    for (const seg of segments) {
      let assignedRow = -1;
      for (let tryRow = 0; tryRow < 10; tryRow++) {
        if (this.isRowAvailable(event, seg, tryRow, ctx)) {
          assignedRow = tryRow;
          break;
        }
      }
      if (assignedRow === -1) assignedRow = 0;
      rowPerWeek.set(seg.weekIndex, assignedRow);
    }

    return rowPerWeek;
  }

  /**
   * A row is available if the event does not time-overlap any existing interval in that row.
   * Strict inequality: an event starting exactly when another ends is NOT considered overlapping.
   */
  private isRowAvailable(
    event: CalendarEvent,
    seg: WeekSegment,
    row: number,
    ctx: MonthLayoutContext,
  ): boolean {
    const eff = this.effectiveInterval(event);
    for (let dayIdx = seg.firstDayIndex; dayIdx <= seg.lastDayIndex; dayIdx++) {
      for (const interval of ctx.rowsPerDay[seg.weekIndex][dayIdx][row].intervals) {
        if (
          eff.start.toMillis() < interval.end.toMillis() &&
          eff.end.toMillis() > interval.start.toMillis()
        ) {
          return false;
        }
      }
    }
    return true;
  }

  private recordOccupiedIntervals(
    event: CalendarEvent,
    segments: WeekSegment[],
    rowPerWeek: Map<number, number>,
    ctx: MonthLayoutContext,
  ): void {
    const eff = this.effectiveInterval(event);
    for (const seg of segments) {
      const row = rowPerWeek.get(seg.weekIndex)!;
      for (let dayIdx = seg.firstDayIndex; dayIdx <= seg.lastDayIndex; dayIdx++) {
        ctx.rowsPerDay[seg.weekIndex][dayIdx][row].intervals.push(eff);
      }
    }
  }

  /**
   * Returns the time interval to use for collision detection.
   * Events shorter than MIN_SINGLE_DAY_WIDTH_FRACTION of a day are expanded to fill
   * the full day column when rendered, so they are treated as occupying the full day
   * here too — preventing adjacent (non-overlapping) short events from sharing a row
   * and rendering on top of each other.
   */
  private effectiveInterval(event: CalendarEvent): { start: DateTime; end: DateTime } {
    const durationHours = event.end.diff(event.start, 'hours').hours;
    if (durationHours < 24 * this.MIN_SINGLE_DAY_WIDTH_FRACTION) {
      const dayStart = event.start.startOf('day');
      return { start: dayStart, end: dayStart.plus({ days: 1 }) };
    }
    return { start: event.start, end: event.end };
  }

  private renderSegment(
    event: CalendarEvent,
    seg: WeekSegment,
    range: EventGridRange,
    rowPerWeek: Map<number, number>,
    ctx: MonthLayoutContext,
  ): void {
    const weekAssignedRow = rowPerWeek.get(seg.weekIndex) ?? 0;
    const topPercent =
      seg.weekIndex * ctx.weekHeightPercent +
      ctx.dayHeaderHeightPercent +
      weekAssignedRow * ctx.eventRowHeightPercent;
    const { leftPercent, widthPercent } = this.calculateSegmentBounds(
      event,
      seg,
      range,
      ctx.dayWidth,
    );
    const spanDays = seg.lastDayIndex - seg.firstDayIndex + 1;

    const layout = this.buildPositionLayout(
      leftPercent,
      widthPercent,
      weekAssignedRow,
      seg.weekIndex,
      seg.firstDayIndex + 1,
      spanDays,
    );

    const dayKey =
      range.startWeekIndex === range.endWeekIndex ? range.startDayIndex : seg.firstDayIndex;

    if (weekAssignedRow >= this.MAX_VISIBLE_EVENTS_PER_ROW) {
      const mapKey = `${seg.weekIndex}-${dayKey}`;
      const existing = ctx.hiddenEventsMap.get(mapKey);
      if (existing) {
        existing.count++;
      } else {
        ctx.hiddenEventsMap.set(mapKey, { count: 1, weekIndex: seg.weekIndex, dayKey });
      }
      return;
    }

    ctx.positioned.push({
      ...event,
      layout,
      sizing: this.buildSizing({
        topPercent,
        heightPercentMonth: ctx.eventRowHeightPercent * this.EVENT_HEIGHT_FRACTION,
      }),
      metadata: this.buildViewMetadata(seg.firstDayIndex, 0, event.start, event.end),
    });
  }

  private calculateSegmentBounds(
    event: CalendarEvent,
    seg: WeekSegment,
    range: EventGridRange,
    dayWidth: number,
  ): { leftPercent: number; widthPercent: number } {
    const {
      startWeekIndex,
      startDayIndex,
      endDayIndex,
      endWeekIndex,
      eventStartsBeforeVisible,
      eventEndsAfterVisible,
    } = range;
    const isSingleWeek =
      startWeekIndex === endWeekIndex && !eventStartsBeforeVisible && !eventEndsAfterVisible;

    if (isSingleWeek) {
      return this.singleWeekBounds(startDayIndex, endDayIndex, dayWidth);
    }
    if (seg.weekIndex === startWeekIndex) {
      return this.firstWeekBounds(event, seg, range, dayWidth);
    }
    if (seg.weekIndex === endWeekIndex) {
      return this.lastWeekBounds(event, seg, range, dayWidth);
    }
    // Middle week: span entire week
    const leftPercent = seg.firstDayIndex * dayWidth;
    return { leftPercent, widthPercent: (seg.lastDayIndex - seg.firstDayIndex + 1) * dayWidth };
  }

  private singleWeekBounds(
    startDayIndex: number,
    endDayIndex: number,
    dayWidth: number,
  ): { leftPercent: number; widthPercent: number } {
    return {
      leftPercent: startDayIndex * dayWidth,
      widthPercent: (endDayIndex - startDayIndex + 1) * dayWidth,
    };
  }

  private firstWeekBounds(
    event: CalendarEvent,
    seg: WeekSegment,
    range: EventGridRange,
    dayWidth: number,
  ): { leftPercent: number; widthPercent: number } {
    if (range.eventStartsBeforeVisible) {
      const leftPercent = 0;
      if (seg.weekIndex === range.endWeekIndex && !range.eventEndsAfterVisible) {
        return { leftPercent, widthPercent: (seg.lastDayIndex + 1) * dayWidth };
      }
      return { leftPercent, widthPercent: (seg.lastDayIndex + 1) * dayWidth };
    }
    const leftPercent = seg.firstDayIndex * dayWidth;
    return { leftPercent, widthPercent: (seg.lastDayIndex + 1) * dayWidth - leftPercent };
  }

  private lastWeekBounds(
    event: CalendarEvent,
    seg: WeekSegment,
    range: EventGridRange,
    dayWidth: number,
  ): { leftPercent: number; widthPercent: number } {
    const leftPercent = seg.firstDayIndex * dayWidth;
    if (range.eventEndsAfterVisible) {
      return { leftPercent, widthPercent: 100 - leftPercent };
    }
    return { leftPercent, widthPercent: (seg.lastDayIndex + 1) * dayWidth - leftPercent };
  }

  private emitOverflowBadges(ctx: MonthLayoutContext): void {
    for (const { count, weekIndex, dayKey } of ctx.hiddenEventsMap.values()) {
      const topPercent =
        weekIndex * ctx.weekHeightPercent +
        ctx.dayHeaderHeightPercent +
        this.MAX_VISIBLE_EVENTS_PER_ROW * ctx.eventRowHeightPercent;

      ctx.positioned.push({
        id: `overflow-${weekIndex}-${dayKey}`,
        title: '',
        start: ctx.weeks[weekIndex][dayKey].startOf('day'),
        end: ctx.weeks[weekIndex][dayKey].endOf('day'),
        color: 'transparent',
        layout: this.buildPositionLayout(
          dayKey * ctx.dayWidth,
          ctx.dayWidth,
          this.MAX_VISIBLE_EVENTS_PER_ROW,
          weekIndex,
          dayKey + 1,
          1,
        ),
        sizing: this.buildSizing({
          topPercent,
          heightPercentMonth: ctx.eventRowHeightPercent * this.EVENT_HEIGHT_FRACTION,
        }),
        metadata: this.buildViewMetadata(dayKey, count),
      });
    }
  }
}
