import { DateTime } from 'luxon';
import { PositionLayout, SizingConfig, ViewMetadata } from './calendar-event';

/** Minimal slice representation used by the greedy column assignment algorithm. */
export interface TimeSlice {
  startRow: number;
  rowSpan: number;
}

/** Result of column assignment for a single slice. */
export interface ColumnAssignment {
  colIndex: number;
  totalColumns: number;
}

/**
 * Shared base class for the month, week and day layout engines.
 *
 * Provides:
 * - Common grid constants (`MAX_ROWS`, `ROWS_PER_HOUR`)
 * - Identical builder helpers used by all three engines
 * - The greedy column-assignment algorithm shared by week and day views
 */
export abstract class CalendarLayoutBase {
  /** Total 15-minute rows in a 24-hour day (24 × 4). */
  protected readonly MAX_ROWS = 96;

  /** Number of grid rows per hour. */
  protected readonly ROWS_PER_HOUR = 4;

  // ── Builder helpers ──────────────────────────────────────────────

  protected buildPositionLayout(
    left: number,
    width: number,
    row: number,
    weekIndex: number,
    colStart: number,
    colSpan: number,
  ): PositionLayout {
    return { left, width, row, weekIndex, colStart, colSpan };
  }

  protected buildSizing(config: Partial<SizingConfig>): SizingConfig {
    return config;
  }

  protected buildViewMetadata(
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

  // ── Shared algorithm ─────────────────────────────────────────────

  /**
   * Greedy column assignment for overlapping time slices.
   *
   * Given an array of slices (already **sorted** by `startRow` ascending,
   * then `rowSpan` descending), assigns each slice to the first available
   * sub-column and determines the total number of columns in its overlap
   * cluster.
   *
   * @returns An array of `ColumnAssignment` objects in the same order as the
   *          input slices.
   */
  protected assignColumns(slices: TimeSlice[]): ColumnAssignment[] {
    const colEndRows: number[] = [];
    const colIndices: number[] = new Array(slices.length);

    // Pass 1: assign each slice to the first free sub-column
    for (let si = 0; si < slices.length; si++) {
      const { startRow, rowSpan } = slices[si];
      let col = colEndRows.findIndex((endRow) => endRow <= startRow);
      if (col === -1) col = colEndRows.length;
      colEndRows[col] = startRow + rowSpan;
      colIndices[si] = col;
    }

    // Pass 2: determine the widest overlap cluster each slice belongs to
    const assignments: ColumnAssignment[] = new Array(slices.length);
    for (let si = 0; si < slices.length; si++) {
      const { startRow: sStart, rowSpan: sSpan } = slices[si];
      let maxColIndex = colIndices[si];
      for (let sj = 0; sj < slices.length; sj++) {
        const { startRow: oStart, rowSpan: oSpan } = slices[sj];
        if (oStart < sStart + sSpan && oStart + oSpan > sStart) {
          if (colIndices[sj] > maxColIndex) maxColIndex = colIndices[sj];
        }
      }
      assignments[si] = { colIndex: colIndices[si], totalColumns: maxColIndex + 1 };
    }

    return assignments;
  }

  // ── Row calculation helpers ──────────────────────────────────────

  /** Convert a DateTime to a grid row index (0–95) within its day. */
  protected timeToRow(time: DateTime): number {
    return time.hour * this.ROWS_PER_HOUR + Math.floor(time.minute / (60 / this.ROWS_PER_HOUR));
  }

  /** Calculate the row span (number of 15-min rows) between two DateTimes. */
  protected durationToRowSpan(start: DateTime, end: DateTime): number {
    const mins = end.diff(start, 'minutes').minutes;
    return Math.max(1, Math.ceil(mins / (60 / this.ROWS_PER_HOUR)));
  }
}
