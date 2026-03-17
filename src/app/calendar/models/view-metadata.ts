import { DateTime } from 'luxon';

/**
 * Auxiliary rendering metadata attached to every `PositionedEvent`.
 *
 * This data is used by the template to make decisions that the layout
 * engines cannot express through position and size alone — for example
 * which padding to apply at column boundaries, or how many hidden events
 * to show in an overflow badge.
 */
export interface ViewMetadata {
  /**
   * Zero-based index of the day column this event (or event slice) belongs to.
   * In week view: 0 (Monday) – 6 (Sunday). In day view: always 0.
   * In month view: the day column of the event's start cell.
   */
  dayIndex?: number;
  /**
   * Number of events hidden behind an overflow "+N more" badge.
   * Only set on synthetic overflow badge events emitted by the month layout.
   */
  hiddenCount?: number;
  /**
   * The original, unclipped start time of the event.
   * Preserved so that the sidebar edit form can display and modify the true
   * start even when the rendered chip has been clipped to a day boundary.
   */
  eventStart?: DateTime;
  /**
   * The original, unclipped end time of the event.
   * See `eventStart` for the rationale.
   */
  eventEnd?: DateTime;
  /**
   * Number of 15-minute grid rows this event occupies.
   * Only set in day and week views; used to calculate the chip height.
   */
  rowSpan?: number;
  /**
   * The `id` of the originating `CalendarEvent` before the layout engine
   * replaced it with a per-day slice id (e.g. `"event-1-day3"`).
   * Only set on multi-day slices in the week view.
   */
  sourceId?: string;
  /**
   * Left inset in pixels applied to the event chip.
   * `6` px at a column edge (gives visual breathing room at the grid boundary);
   * `1` px between adjacent events in the same column group.
   */
  paddingLeft?: number;
  /**
   * Right inset in pixels applied to the event chip.
   * Same conventions as `paddingLeft`.
   */
  paddingRight?: number;
}
