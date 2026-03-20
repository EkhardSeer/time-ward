/** Total 15-minute rows in a 24-hour day (24 × 4). */
export const MAX_ROWS = 96;

/** Default height in pixels of one 15-minute grid row. */
export const ROW_HEIGHT_PX = 15;

/** Number of grid rows per hour. */
export const ROWS_PER_HOUR = 4;

/** Days in a week. */
export const DAYS_IN_WEEK = 7;

/** Width of one day column as a percentage of the full calendar width (100 / 7). */
export const DAY_WIDTH_PERCENT = 100 / 7;

/** Pixel gap between an event chip and the left edge of its day column. */
export const EVENT_EDGE_PADDING_LEFT = 8;

/** Pixel gap between an event chip and the right edge of its day column. */
export const EVENT_EDGE_PADDING_RIGHT = 4;

/** Pixel gap between adjacent event chips sharing a day column (inner overlap gap). */
export const EVENT_INNER_PADDING = 3;

/**
 * Maximum number of side-by-side event columns rendered per day in week/day view.
 * When more events overlap at the same time, the extras are collapsed into a
 * "+N more" overflow badge at the right edge of the visible columns.
 */
export const MAX_VISIBLE_TIME_EVENTS = 3;
