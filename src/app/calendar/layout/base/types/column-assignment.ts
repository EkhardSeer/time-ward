/**
 * Result produced by `assignColumns` for a single time slice.
 *
 * The two values together let the layout engine compute the horizontal
 * position and width of an event chip so that all overlapping events
 * share equal column widths and none overlap visually:
 *
 * ```
 * left  = dayOffset + colIndex * (dayWidth / totalColumns)
 * width =                        (dayWidth / totalColumns)
 * ```
 */
export interface ColumnAssignment {
  /**
   * Zero-based sub-column index assigned to this slice.
   * Events in the same time cluster are placed in adjacent sub-columns
   * (0, 1, 2, …) so that they sit side-by-side without overlapping.
   */
  colIndex: number;
  /**
   * Total number of sub-columns in this slice's overlap cluster.
   * All events that overlap with each other (transitively) share the same
   * `totalColumns` value so that equal-width chips fill the full column.
   */
  totalColumns: number;
}
