import { DateTime } from 'luxon';
import {
  CalendarEvent,
  PositionedEvent,
  PositionLayout,
  SizingConfig,
  ViewMetadata,
} from './calendar-event';

export class CalendarDayLayout {
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

  private buildDaySizing(heightPercent: number, topPercent: number): SizingConfig {
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

  // ========== Layout Functions ==========

  /**
   * Layout events for a single day view.
   * Overlapping events are placed side-by-side within the full column width.
   */
  layoutDay(events: CalendarEvent[], day: DateTime): PositionedEvent[] {
    const maxRows = 96;
    const rowsPerHour = 4;
    const dayStart = day.startOf('day');
    const dayEnd = day.endOf('day');

    interface DaySlice {
      event: CalendarEvent;
      startRow: number;
      rowSpan: number;
    }

    const slices: DaySlice[] = [];
    for (const event of events) {
      if (event.end <= dayStart || event.start >= dayEnd) continue;
      const clippedStart = event.start < dayStart ? dayStart : event.start;
      const clippedEnd = event.end > dayEnd ? dayEnd : event.end;
      const startRow =
        clippedStart.hour * rowsPerHour + Math.floor(clippedStart.minute / (60 / rowsPerHour));
      const durationMins = clippedEnd.diff(clippedStart, 'minutes').minutes;
      const rowSpan = Math.max(1, Math.ceil(durationMins / (60 / rowsPerHour)));
      slices.push({ event, startRow, rowSpan });
    }

    slices.sort((a, b) =>
      a.startRow !== b.startRow ? a.startRow - b.startRow : b.rowSpan - a.rowSpan,
    );

    // Greedy column assignment
    const colEndRows: number[] = [];
    const colIndices: number[] = new Array(slices.length);
    for (let si = 0; si < slices.length; si++) {
      const { startRow, rowSpan } = slices[si];
      let col = colEndRows.findIndex((endRow) => endRow <= startRow);
      if (col === -1) col = colEndRows.length;
      colEndRows[col] = startRow + rowSpan;
      colIndices[si] = col;
    }

    const positioned: PositionedEvent[] = [];

    for (let si = 0; si < slices.length; si++) {
      const { startRow: sStart, rowSpan: sSpan } = slices[si];
      let maxColIndex = colIndices[si];
      for (let sj = 0; sj < slices.length; sj++) {
        const { startRow: oStart, rowSpan: oSpan } = slices[sj];
        if (oStart < sStart + sSpan && oStart + oSpan > sStart) {
          if (colIndices[sj] > maxColIndex) maxColIndex = colIndices[sj];
        }
      }
      const totalColumns = maxColIndex + 1;
      const colIndex = colIndices[si];
      const { event, startRow, rowSpan } = slices[si];
      const paddingLeft = colIndex === 0 ? 6 : 1;
      const paddingRight = colIndex === totalColumns - 1 ? 6 : 1;
      const left = colIndex * (100 / totalColumns);
      const width = 100 / totalColumns;
      const layout = this.buildPositionLayout(left, width, startRow, 0, 1, 1);
      const sizing = this.buildDaySizing(rowSpan * (100 / maxRows), startRow * (100 / maxRows));
      const metadata = this.buildViewMetadata(
        0,
        undefined,
        event.start,
        event.end,
        rowSpan,
        paddingLeft,
        paddingRight,
      );
      positioned.push({ ...event, layout, sizing, metadata });
    }

    return positioned;
  }
}
