/**
 * Minimal representation of a time-block used by the greedy column-assignment
 * algorithm (`assignColumns`).
 *
 * Layout engines convert their internal slice types (`DaySlice`, `WeekSlice`)
 * to this narrower shape before calling `assignColumns` so that the algorithm
 * stays completely generic.
 */
export interface TimeSlice {
  /** Zero-based start row within the 96-row quarter-hour grid. */
  startRow: number;
  /** Number of grid rows this slice occupies (minimum 1). */
  rowSpan: number;
}
