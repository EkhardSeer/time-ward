import { DateTime } from 'luxon';
import { TemplateRef } from '@angular/core';
import { CalendarAction } from './calendar-action';

/**
 * Represents a single event displayed on the calendar.
 *
 * This is the primary input type for the `CalendarComponent`. The host
 * application creates and manages these objects. For read-only display the
 * minimum required fields are `id`, `title`, `start`, `end`, and `color`.
 *
 * @example
 * ```ts
 * const event: CalendarEvent = {
 *   id: 'meeting-1',
 *   title: 'Team standup',
 *   start: DateTime.now().set({ hour: 9 }),
 *   end:   DateTime.now().set({ hour: 9, minute: 30 }),
 *   color: '#1976d2',
 * };
 * ```
 */
export interface CalendarEvent {
  /** Unique identifier for this event. Must be stable across renders. */
  id: string;
  /** Human-readable label rendered inside the event chip. */
  title: string;
  /** Inclusive start of the event. */
  start: DateTime;
  /**
   * Exclusive end of the event.
   * An event ending exactly at midnight (i.e. `startOf('day')`) is treated
   * as ending at the end of the previous day by the month layout engine.
   */
  end: DateTime;
  /** CSS color string (hex, rgb, named color, etc.) for the event chip background. */
  color: string;
  /**
   * Optional per-event sidebar template.
   * When provided, this template is rendered in the sidebar instead of the
   * built-in edit form or the component-level `detailsTemplate`.
   * Template context: `{ $implicit: CalendarEvent }`.
   */
  sidebarTemplate?: TemplateRef<{ $implicit: CalendarEvent }>;
  /**
   * Arbitrary domain data attached by the host application.
   * The calendar ignores this field entirely; cast it to the appropriate
   * domain type inside a `sidebarTemplate` or event-output handler.
   */
  data?: unknown;
  /**
   * Per-event context-menu actions.
   * When set, replaces the global `[actions]` input for this event.
   * Pass an empty array `[]` to suppress the menu entirely for this event.
   */
  actions?: CalendarAction[];
}
