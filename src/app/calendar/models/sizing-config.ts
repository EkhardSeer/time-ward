/**
 * View-specific height and vertical-position configuration for a rendered event.
 *
 * Exactly which fields are populated depends on the active view:
 * - **Day / week views** populate `heightPercent` and `topPercent` (both
 *   derived from the 96-row quarter-hour grid).
 * - **Month view** populates `heightPercentMonth` and `topPercent` (fixed
 *   row-slot heights; `heightPercent` is not used).
 */
export interface SizingConfig {
  /**
   * Event height as a percentage of the total scrollable time column.
   * Only set in day and week views; proportional to the event duration.
   */
  heightPercent?: number;
  /**
   * Distance from the top of the scrollable container, in percent.
   * Set in all views. In month view this places the event within its week row.
   */
  topPercent?: number;
  /**
   * Fixed event height as a percentage of the total calendar area.
   * Only set in month view; independent of duration.
   */
  heightPercentMonth?: number;
}
