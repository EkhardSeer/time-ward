import { CalendarEvent } from './calendar-event';

/**
 * A named, coloured collection of events that can be shown or hidden
 * independently in the calendar.
 *
 * Pass an array of `CalendarSource` objects to the `[calendars]` input to
 * enable the multi-calendar experience. The calendar will render a toggle
 * chip for each source in the toolbar and only include events from enabled
 * sources in the grid.
 *
 * @example
 * ```ts
 * const sources: CalendarSource[] = [
 *   { id: 'work',     label: 'Work',     color: '#1976d2', events: workEvents },
 *   { id: 'personal', label: 'Personal', color: '#388e3c', events: personalEvents },
 * ];
 * ```
 */
export interface CalendarSource {
  /** Stable unique identifier for this calendar source. */
  id: string;
  /** Human-readable name shown in the toggle chip. */
  label: string;
  /**
   * Accent colour for the toggle chip indicator.
   * Does not override individual event chip colours — set `event.color` on
   * each event if you want per-event colouring.
   */
  color: string;
  /** The events belonging to this source. */
  events: CalendarEvent[];
}
