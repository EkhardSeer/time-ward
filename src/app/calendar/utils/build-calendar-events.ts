import { TemplateRef } from '@angular/core';
import { DateTime } from 'luxon';
import { CalendarEvent } from '../models/calendar-event';

/**
 * Options for {@link buildCalendarEvents}.
 *
 * @template T The type of the source domain objects.
 */
export interface BuildCalendarEventsOptions<T> {
  /**
   * Event chip background colour.
   *
   * - A **string** applies the same colour to every event.
   * - A **function** receives each source item and returns a colour, letting
   *   you derive the colour from domain data (e.g. order status).
   *
   * Defaults to `'#1976d2'` when omitted.
   */
  color?: string | ((item: T) => string);
  /**
   * Sidebar details template rendered when the user clicks an event.
   * The template context is `{ $implicit: CalendarEvent }`, where
   * `event.data` holds the original source item.
   *
   * When omitted the calendar falls back to its built-in edit panel.
   */
  sidebarTemplate?: TemplateRef<{ $implicit: CalendarEvent }>;
}

/**
 * Maps an array of domain objects into {@link CalendarEvent} objects ready for
 * the `<app-calendar>` component.
 *
 * The `start` and `end` values are resolved from the keys you specify; they
 * may already be Luxon `DateTime` instances, ISO strings, or JavaScript `Date`
 * objects — all are handled automatically.
 *
 * The original source item is stored in `event.data` so it remains accessible
 * inside a `sidebarTemplate` or event-output handler.
 *
 * @template T The type of the source domain objects.
 *
 * @param source   Array of domain objects to convert.
 * @param idKey    Key whose value becomes `event.id` (coerced to string).
 * @param titleKey Key whose value becomes `event.title` (coerced to string).
 * @param startKey Key holding the event start (`DateTime`, ISO string, or `Date`).
 * @param endKey   Key holding the event end (`DateTime`, ISO string, or `Date`).
 * @param options  Optional colour and sidebar template overrides.
 *
 * @example
 * ```ts
 * const events = buildCalendarEvents(
 *   orders,
 *   'orderId',
 *   'articleName',
 *   'plannedStart',
 *   'plannedEnd',
 *   {
 *     color: (o) => o.status === 'done' ? '#546e7a' : '#2e7d32',
 *     sidebarTemplate: this.orderTpl,
 *   },
 * );
 * ```
 */
export function buildCalendarEvents<T extends object>(
  source: T[],
  idKey: keyof T,
  titleKey: keyof T,
  startKey: keyof T,
  endKey: keyof T,
  options: BuildCalendarEventsOptions<T> = {},
): CalendarEvent[] {
  const { color = '#1976d2', sidebarTemplate } = options;

  return source.map((item) => {
    const resolvedColor = typeof color === 'function' ? color(item) : color;

    return {
      id: String(item[idKey]),
      title: String(item[titleKey]),
      start: toDateTime(item[startKey]),
      end: toDateTime(item[endKey]),
      color: resolvedColor,
      ...(sidebarTemplate ? { sidebarTemplate } : {}),
      data: item,
    };
  });
}

/** Coerces a DateTime, ISO string, or JS Date to a Luxon DateTime. */
function toDateTime(value: unknown): DateTime {
  if (value instanceof DateTime) return value;
  if (value instanceof Date) return DateTime.fromJSDate(value);
  if (typeof value === 'string') return DateTime.fromISO(value);
  throw new Error(`buildCalendarEvents: cannot convert value to DateTime: ${String(value)}`);
}
