import { DateTime } from 'luxon';
import { CalendarEvent, PositionedEvent } from './calendar-event';
import { CalendarLayoutBase } from './calendar-layout-base';

/**
 * Tracks occupied rows for collision detection.
 * Stores time intervals to detect actual overlap, not just day occupancy.
 */
interface RowState {
  intervals: Array<{ start: DateTime; end: DateTime }>;
}

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

  /**
   * Layout events for month view.
   * Produces positioned events with horizontal/vertical collision detection.
   */
  layoutMonth(events: CalendarEvent[], weeks: DateTime[][]): PositionedEvent[] {
    const positioned: PositionedEvent[] = [];
    const weekHeightPercent = 100 / weeks.length; // height per week
    const rowHeightPercent = weekHeightPercent / 4; // height per row (4 rows max per week)
    const eventHeightPercent = rowHeightPercent * 0.7; // event is 70% of row height

    // Track occupied row indices per day in the month grid
    // rowsPerDay[weekIndex][dayIndex][rowIndex] = occupied
    const rowsPerDay: RowState[][][] = weeks.map((week) =>
      Array.from({ length: 7 }, () => Array(10).fill(null)),
    );

    // Track total visible event count per day (across all rows)
    // totalEventCountPerDay[weekIndex][dayIndex] = total visible events
    const totalEventCountPerDay: number[][] = weeks.map((week) => Array(7).fill(0));

    const dayWidth = 100 / 7;
    // Accumulates the count of hidden events per (weekIndex, dayKey) slot
    const hiddenEventsMap = new Map<string, { count: number; weekIndex: number; dayKey: number }>();

    events.forEach((event) => {
      // Find which days/weeks this event touches
      const eventStart = event.start.startOf('day');
      // If event ends exactly at midnight (start of next day), treat it as ending previous day
      const eventEnd = event.end.equals(event.end.startOf('day'))
        ? event.end.minus({ days: 1 }).startOf('day')
        : event.end.startOf('day');

      // Check if event overlaps with ANY visible day
      const firstVisibleDay = weeks[0][0].startOf('day');
      const lastVisibleDay = weeks[weeks.length - 1][6].startOf('day');

      // Skip only if event completely before or after visible weeks (using .toMillis() for proper DateTime comparison)
      if (
        eventEnd.toMillis() < firstVisibleDay.toMillis() ||
        eventStart.toMillis() > lastVisibleDay.toMillis()
      ) {
        return; // Event doesn't overlap with visible month, skip it
      }

      // Find the grid cells for the event's start and end (within visible range)
      let startWeekIndex = -1;
      let startDayIndex = -1;
      let endWeekIndex = -1;
      let endDayIndex = -1;

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

      // If event starts before visible weeks, use first visible day
      if (startWeekIndex === -1) {
        startWeekIndex = 0;
        startDayIndex = 0;
      }

      // If event ends after visible weeks, use last visible day
      if (endWeekIndex === -1) {
        endWeekIndex = weeks.length - 1;
        endDayIndex = 6;
      }

      // Track if event extends beyond visible bounds (using .toMillis() for proper DateTime comparison)
      const eventStartsBeforeVisible = eventStart.toMillis() < firstVisibleDay.toMillis();
      const eventEndsAfterVisible = eventEnd.toMillis() > lastVisibleDay.toMillis();

      // For multi-week events, create separate positioned events for each week
      const weeksToRender: Array<{
        weekIndex: number;
        firstDayIndex: number;
        lastDayIndex: number;
      }> = [];

      if (endWeekIndex === startWeekIndex && !eventStartsBeforeVisible && !eventEndsAfterVisible) {
        // Single-week event that's entirely within visible weeks
        weeksToRender.push({
          weekIndex: startWeekIndex,
          firstDayIndex: startDayIndex,
          lastDayIndex: endDayIndex,
        });
      } else {
        // Multi-week event: create entries for each week it spans
        for (let wIdx = startWeekIndex; wIdx <= endWeekIndex; wIdx++) {
          let firstDay = wIdx === startWeekIndex ? startDayIndex : 0;
          let lastDay = wIdx === endWeekIndex ? endDayIndex : 6;

          weeksToRender.push({
            weekIndex: wIdx,
            firstDayIndex: firstDay,
            lastDayIndex: lastDay,
          });
        }
      }

      // Map storing row position per week (for multi-week events with different rows per week)
      const rowPerWeek: Map<number, number> = new Map();

      // Find and assign rows per week (not just once for all weeks)
      for (const weekSpan of weeksToRender) {
        let weekAssignedRow = -1;

        // Find first available row in this specific week
        for (let tryRow = 0; tryRow < 10; tryRow++) {
          let rowAvailableInWeek = true;

          // Check if this row is free in all days of this week's span
          for (let dayIdx = weekSpan.firstDayIndex; dayIdx <= weekSpan.lastDayIndex; dayIdx++) {
            const dayRows = rowsPerDay[weekSpan.weekIndex][dayIdx];
            if (!dayRows[tryRow]) {
              dayRows[tryRow] = { intervals: [] };
            }

            const rowState = dayRows[tryRow];
            // Check for time overlap using .toMillis() for DateTime comparison
            for (const interval of rowState.intervals) {
              if (
                event.start.toMillis() < interval.end.toMillis() &&
                event.end.toMillis() > interval.start.toMillis()
              ) {
                rowAvailableInWeek = false;
                break;
              }
            }

            if (!rowAvailableInWeek) break;
          }

          if (rowAvailableInWeek) {
            weekAssignedRow = tryRow;
            break;
          }
        }

        if (weekAssignedRow === -1) weekAssignedRow = 0;
        rowPerWeek.set(weekSpan.weekIndex, weekAssignedRow);
      }

      // Record this event's time interval in all cells it spans
      for (const weekSpan of weeksToRender) {
        const weekAssignedRow = rowPerWeek.get(weekSpan.weekIndex)!;

        for (let dayIdx = weekSpan.firstDayIndex; dayIdx <= weekSpan.lastDayIndex; dayIdx++) {
          const dayRows = rowsPerDay[weekSpan.weekIndex][dayIdx];
          if (!dayRows[weekAssignedRow]) {
            dayRows[weekAssignedRow] = { intervals: [] };
          }

          dayRows[weekAssignedRow].intervals.push({ start: event.start, end: event.end });
        }
      }

      // Create positioned events for each week
      for (const weekSpan of weeksToRender) {
        const weekHeightPercent = 100 / weeks.length;
        const rowHeightPercent = weekHeightPercent / 4;

        // Get the row assigned for THIS specific week
        const weekAssignedRow = rowPerWeek.get(weekSpan.weekIndex) ?? 0;
        const topPercent =
          weekSpan.weekIndex * weekHeightPercent + weekAssignedRow * rowHeightPercent;

        // Calculate positioning for this week's span
        const dayWidth = 100 / 7;

        // For multi-week events, adjust left/width based on the specific week
        let eventLeftPercent: number;
        let eventWidthPercent: number;

        // Determine if this is truly a single-week event (no boundary crossing)
        const isSingleWeekEvent =
          startWeekIndex === endWeekIndex && !eventStartsBeforeVisible && !eventEndsAfterVisible;

        if (isSingleWeekEvent) {
          // Single-week event: use duration-based width
          const startDayAbsolutePercent = startDayIndex * dayWidth;
          const startHourFraction = event.start.hour + event.start.minute / 60;
          const hourOffsetPercent = (startHourFraction / 24) * dayWidth;
          eventLeftPercent = startDayAbsolutePercent + hourOffsetPercent;

          const durationMinutes = event.end.diff(event.start, 'minutes').minutes;
          const durationHours = durationMinutes / 60;
          eventWidthPercent = (durationHours / 24) * dayWidth;
        } else if (weekSpan.weekIndex === startWeekIndex) {
          // First week of multi-week event OR event continuing from before visible weeks
          if (eventStartsBeforeVisible) {
            // Event started before visible weeks, so start from left edge (0%)
            eventLeftPercent = 0;

            // Check if event also ends in this week
            if (weekSpan.weekIndex === endWeekIndex && !eventEndsAfterVisible) {
              // Event starts before visible but ends in this week - use actual end time
              const endDayAbsolutePercent = weekSpan.lastDayIndex * dayWidth;
              const endHourFraction = event.end.hour + event.end.minute / 60;
              const hourOffsetPercent = (endHourFraction / 24) * dayWidth;
              const endOfEventPercent = endDayAbsolutePercent + hourOffsetPercent;
              eventWidthPercent = endOfEventPercent - eventLeftPercent;
            } else {
              // Event continues beyond this week - span to end of week
              const endOfWeekPercent = (weekSpan.lastDayIndex + 1) * dayWidth;
              eventWidthPercent = endOfWeekPercent - eventLeftPercent;
            }
          } else {
            const startDayAbsolutePercent = weekSpan.firstDayIndex * dayWidth;
            const startHourFraction = event.start.hour + event.start.minute / 60;
            const hourOffsetPercent = (startHourFraction / 24) * dayWidth;
            eventLeftPercent = startDayAbsolutePercent + hourOffsetPercent;

            // Width spans from start time to end of week
            const endOfWeekPercent = (weekSpan.lastDayIndex + 1) * dayWidth;
            eventWidthPercent = endOfWeekPercent - eventLeftPercent;
          }
        } else if (weekSpan.weekIndex === endWeekIndex) {
          // Last week: position from start of week to event end time
          eventLeftPercent = weekSpan.firstDayIndex * dayWidth;

          if (eventEndsAfterVisible) {
            // Event ends after visible weeks, so extend to right edge (100%)
            eventWidthPercent = 100 - eventLeftPercent;
          } else {
            const endDayAbsolutePercent = weekSpan.lastDayIndex * dayWidth;
            const endHourFraction = event.end.hour + event.end.minute / 60;
            const hourOffsetPercent = (endHourFraction / 24) * dayWidth;
            const endOfEventPercent = endDayAbsolutePercent + hourOffsetPercent;

            eventWidthPercent = endOfEventPercent - eventLeftPercent;
          }
        } else {
          // Middle week: span entire week
          eventLeftPercent = weekSpan.firstDayIndex * dayWidth;
          eventWidthPercent = (weekSpan.lastDayIndex - weekSpan.firstDayIndex + 1) * dayWidth;
        }

        const spanDays = weekSpan.lastDayIndex - weekSpan.firstDayIndex + 1;

        const layout = this.buildPositionLayout(
          eventLeftPercent,
          eventWidthPercent,
          weekAssignedRow,
          weekSpan.weekIndex,
          weekSpan.firstDayIndex + 1,
          spanDays,
        );

        // Check if this event should be visible or if it exceeds the max per day
        const dayKey = startWeekIndex === endWeekIndex ? startDayIndex : weekSpan.firstDayIndex;
        const currentDayTotal = totalEventCountPerDay[weekSpan.weekIndex][dayKey];

        if (currentDayTotal >= this.MAX_VISIBLE_EVENTS_PER_ROW) {
          // Accumulate into the overflow badge for this day; don't render individually
          const mapKey = `${weekSpan.weekIndex}-${dayKey}`;
          const existing = hiddenEventsMap.get(mapKey);
          if (existing) {
            existing.count++;
          } else {
            hiddenEventsMap.set(mapKey, { count: 1, weekIndex: weekSpan.weekIndex, dayKey });
          }
          continue;
        }

        totalEventCountPerDay[weekSpan.weekIndex][dayKey]++;

        // Calculate event height: consistent height for all events in slot
        const weekEventHeightPercent = rowHeightPercent * 0.7;

        const sizing = this.buildSizing({ topPercent, heightPercentMonth: weekEventHeightPercent });

        const metadata = this.buildViewMetadata(weekSpan.firstDayIndex, 0, event.start, event.end);

        positioned.push({
          ...event,
          layout,
          sizing,
          metadata,
        });
      }
    });

    // Push one overflow badge per day that has hidden events
    for (const { count, weekIndex, dayKey } of hiddenEventsMap.values()) {
      const topPercent =
        weekIndex * weekHeightPercent + this.MAX_VISIBLE_EVENTS_PER_ROW * rowHeightPercent;
      const overflowLayout = this.buildPositionLayout(
        dayKey * dayWidth,
        dayWidth,
        this.MAX_VISIBLE_EVENTS_PER_ROW,
        weekIndex,
        dayKey + 1,
        1,
      );
      const overflowSizing = this.buildSizing({
        topPercent,
        heightPercentMonth: rowHeightPercent * 0.7,
      });
      const overflowMetadata = this.buildViewMetadata(dayKey, count);

      positioned.push({
        id: `overflow-${weekIndex}-${dayKey}`,
        title: '',
        start: weeks[weekIndex][dayKey].startOf('day'),
        end: weeks[weekIndex][dayKey].endOf('day'),
        color: 'transparent',
        layout: overflowLayout,
        sizing: overflowSizing,
        metadata: overflowMetadata,
      });
    }

    return positioned;
  }
}
