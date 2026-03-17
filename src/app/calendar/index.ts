/**
 * Public API surface for the Calendar feature.
 */
export { CalendarComponent } from './calendar.component';
export type { CalendarEvent } from './models/calendar-event';
export type { CalendarSource } from './models/calendar-source';
export type { PositionedEvent } from './models/positioned-event';
export type { CalendarI18n } from './models/calendar-i18n';
export { CALENDAR_I18N, DE_CALENDAR_I18N, EN_CALENDAR_I18N } from './models/calendar-i18n';
export { buildCalendarEvents } from './utils/build-calendar-events';
export type { BuildCalendarEventsOptions } from './utils/build-calendar-events';
