import { DateTime } from 'luxon';
import { CalendarEvent } from '../../models/calendar-event';
import { PositionLayout } from '../../models/position-layout';
import { SizingConfig } from '../../models/sizing-config';
import { ViewMetadata } from '../../models/view-metadata';
import { TimeSlice } from './types/time-slice';
import { ColumnAssignment } from './types/column-assignment';

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

  /**
   * Caps the visible event columns in a day to `max` and groups the overflow
   * into badge descriptors (one per overlap cluster with hidden events).
   *
   * Overlap clusters are detected transitively: if A overlaps B and B overlaps C
   * they all share one cluster even if A and C don't directly overlap.
   *
   * For clusters that have overflow, the visible slices have their `totalColumns`
   * adjusted to `max + 1` so they each take `1/(max+1)` of the column width
   * and leave room for the badge at position `max`.
   */
  protected capAndSplit<T extends TimeSlice & { event: CalendarEvent }>(
    slices: T[],
    columns: ColumnAssignment[],
    max: number,
  ): {
    visible: Array<{ slice: T; colIndex: number; totalColumns: number }>;
    badges: Array<{ event: CalendarEvent; startRow: number; rowSpan: number; count: number }>;
  } {
    // Build transitive overlap clusters over all slices
    const clusterOf = new Array<number>(slices.length).fill(-1);
    const clusters: number[][] = [];

    for (let i = 0; i < slices.length; i++) {
      if (clusterOf[i] !== -1) continue;
      const cluster = [i];
      clusterOf[i] = clusters.length;
      for (let j = i + 1; j < slices.length; j++) {
        if (clusterOf[j] !== -1) continue;
        for (const mi of cluster) {
          const a = slices[mi];
          const b = slices[j];
          if (a.startRow < b.startRow + b.rowSpan && a.startRow + a.rowSpan > b.startRow) {
            cluster.push(j);
            clusterOf[j] = clusters.length;
            break;
          }
        }
      }
      clusters.push(cluster);
    }

    const visible: Array<{ slice: T; colIndex: number; totalColumns: number }> = [];
    const badges: Array<{
      event: CalendarEvent;
      startRow: number;
      rowSpan: number;
      count: number;
    }> = [];

    for (const cluster of clusters) {
      const hiddenInCluster = cluster.filter((si) => columns[si].colIndex >= max);
      const hasOverflow = hiddenInCluster.length > 0;

      for (const si of cluster) {
        const col = columns[si];
        if (col.colIndex < max) {
          visible.push({
            slice: slices[si],
            colIndex: col.colIndex,
            totalColumns: hasOverflow ? max + 1 : col.totalColumns,
          });
        }
      }

      if (hasOverflow) {
        const minStart = Math.min(...hiddenInCluster.map((si) => slices[si].startRow));
        const maxEnd = Math.max(
          ...hiddenInCluster.map((si) => slices[si].startRow + slices[si].rowSpan),
        );
        badges.push({
          event: slices[hiddenInCluster[0]].event,
          startRow: minStart,
          rowSpan: Math.max(2, maxEnd - minStart),
          count: hiddenInCluster.length,
        });
      }
    }

    return { visible, badges };
  }
}
