import { DateTime } from 'luxon';
import {
  CalendarEvent,
  PositionedEvent,
  PositionLayout,
  SizingConfig,
  ViewMetadata,
} from './calendar-event';

export class CalendarWeekLayout {
  // ========== Builder Functions ==========

  private buildPositionLayout(
    left: number,
    width: number,
    row: number,
    weekIndex: number,
    colStart: number,
    colSpan: number,
  ): PositionLayout {
    return { left, width, row, weekIndex, colStart, colSpan };
  }

  private buildWeekSizing(heightPercent: number, topPercent: number): SizingConfig {
    return { heightPercent, topPercent };
  }

  private buildViewMetadata(
    dayIndex?: number,
    hiddenCount?: number,
    eventStart?: DateTime,
    eventEnd?: DateTime,
    rowSpan?: number,
    paddingLeft?: number,
    paddingRight?: number,
  ): ViewMetadata {
    return { dayIndex, hiddenCount, eventStart, eventEnd, rowSpan, paddingLeft, paddingRight };
  }

  // ========== Generator Functions ==========

  /** Generate a single week grid */
  generateWeek(date: DateTime): DateTime[] {
    const startOfWeek = date.startOf('week');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.plus({ days: i }));
  }

  // ========== Layout Functions ==========

  /**
   * Layout events for week view with side-by-side rendering for overlapping events.
   * Events that overlap in time on the same day are placed in adjacent sub-columns
   * within the day column, narrowing proportionally as more events overlap.
   */
  layoutWeek(events: CalendarEvent[], week: DateTime[]): PositionedEvent[] {
    const maxRows = 96; // 24h × 4 rows/hour
    const rowsPerHour = 4;
    const dayWidth = 100 / 7;
    const weekStart = week[0].startOf('day');

    interface Slice {
      event: CalendarEvent;
      sliceId: string;
      startRow: number;
      rowSpan: number;
      dayNum: number;
    }

    // Step 1: Collect one slice per event per day it occupies within the week
    const slicesPerDay: Slice[][] = Array.from({ length: 7 }, () => []);

    for (const event of events) {
      const dayIndex = Math.floor(event.start.diff(weekStart, 'days').days);
      const endDayIndex = Math.floor(event.end.diff(weekStart, 'days').days);

      if (endDayIndex < 0 || dayIndex >= 7) continue;

      const firstDay = Math.max(0, dayIndex);
      const lastDay = Math.min(6, endDayIndex);

      for (let dayNum = firstDay; dayNum <= lastDay; dayNum++) {
        const dayStart = weekStart.plus({ days: dayNum }).startOf('day');
        const dayEnd = dayStart.endOf('day');
        const clippedStart = event.start > dayStart ? event.start : dayStart;
        const clippedEnd = event.end < dayEnd ? event.end : dayEnd;

        const startRow =
          clippedStart.hour * rowsPerHour + Math.floor(clippedStart.minute / (60 / rowsPerHour));
        const durationMins = clippedEnd.diff(clippedStart, 'minutes').minutes;
        const rowSpan = Math.max(1, Math.ceil(durationMins / (60 / rowsPerHour)));

        slicesPerDay[dayNum].push({
          event,
          sliceId: dayIndex === endDayIndex ? event.id : `${event.id}-day${dayNum}`,
          startRow,
          rowSpan,
          dayNum,
        });
      }
    }

    // Step 2: For each day column, assign horizontal sub-columns and build positioned events
    const positioned: PositionedEvent[] = [];

    for (let dayNum = 0; dayNum < 7; dayNum++) {
      const slices = slicesPerDay[dayNum];
      if (!slices.length) continue;

      // Sort by start row; for ties, longer events get the leftmost sub-column
      slices.sort((a, b) =>
        a.startRow !== b.startRow ? a.startRow - b.startRow : b.rowSpan - a.rowSpan,
      );

      // Greedy column assignment: each event goes to the first sub-column that is free
      const colEndRows: number[] = []; // colEndRows[i] = end row of last event in sub-column i
      const colIndices: number[] = new Array(slices.length);

      for (let si = 0; si < slices.length; si++) {
        const { startRow, rowSpan } = slices[si];
        let col = colEndRows.findIndex((endRow) => endRow <= startRow);
        if (col === -1) col = colEndRows.length; // Open a new sub-column
        colEndRows[col] = startRow + rowSpan;
        colIndices[si] = col;
      }

      // Determine totalColumns per slice = widest overlap cluster the slice belongs to
      for (let si = 0; si < slices.length; si++) {
        const { startRow: sStart, rowSpan: sSpan } = slices[si];
        let maxColIndex = colIndices[si];

        for (let sj = 0; sj < slices.length; sj++) {
          const { startRow: oStart, rowSpan: oSpan } = slices[sj];
          // Check time overlap between slice si and slice sj
          if (oStart < sStart + sSpan && oStart + oSpan > sStart) {
            if (colIndices[sj] > maxColIndex) maxColIndex = colIndices[sj];
          }
        }

        const totalColumns = maxColIndex + 1;
        const colIndex = colIndices[si];
        const { event, sliceId, startRow, rowSpan } = slices[si];

        const paddingLeft = colIndex === 0 ? 6 : 1;
        const paddingRight = colIndex === totalColumns - 1 ? 6 : 1;

        const left = dayNum * dayWidth + colIndex * (dayWidth / totalColumns);
        const width = dayWidth / totalColumns;

        const layout = this.buildPositionLayout(left, width, startRow, 0, dayNum + 1, 1);
        const sizing = this.buildWeekSizing(rowSpan * (100 / maxRows), startRow * (100 / maxRows));
        const metadata = this.buildViewMetadata(
          dayNum,
          undefined,
          event.start,
          event.end,
          rowSpan,
          paddingLeft,
          paddingRight,
        );

        positioned.push({
          ...event,
          id: sliceId,
          layout,
          sizing,
          metadata: { ...metadata, sourceId: event.id },
        });
      }
    }

    return positioned;
  }
}
