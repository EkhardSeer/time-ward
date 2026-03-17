import { DateTime } from 'luxon';
import { PositionLayout } from '../../models/position-layout';
import { SizingConfig } from '../../models/sizing-config';
import { ViewMetadata } from '../../models/view-metadata';

export type { TimeSlice } from './types/time-slice';
export type { ColumnAssignment } from './types/column-assignment';

/**
 * Shared base class for the month, week and day layout engines.
 *
 * Provides thin builder helpers over the shared model types.
 * Pure calculations (timeToRow, durationToRowSpan, assignColumns) live in
 * layout/utils/ and are imported directly by each engine.
 */
export abstract class CalendarLayoutBase {
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
}
