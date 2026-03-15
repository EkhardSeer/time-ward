import { DateTime } from 'luxon';
import { TemplateRef } from '@angular/core';

export interface CalendarEvent {
  id: string;
  title: string;
  start: DateTime;
  end: DateTime;
  color: string;
  /** Optional per-event sidebar template. Rendered instead of detailsTemplate or the built-in edit form. Context: `{ $implicit: CalendarEvent }` */
  sidebarTemplate?: TemplateRef<{ $implicit: CalendarEvent }>;
  /** Arbitrary domain data attached by the host. Cast to the appropriate type in the sidebar template. */
  data?: unknown;
}

/**
 * CSS & Grid positioning for an event
 * - left/width: percentage offsets within the week
 * - row: row index (0-based, used differently per view)
 * - weekIndex/colStart/colSpan: CSS Grid properties
 */
export interface PositionLayout {
  left: number; // horizontal % offset
  width: number; // horizontal % width
  row: number; // row index (month or week)
  weekIndex: number; // which week row (month view)
  colStart: number; // grid column start
  colSpan: number; // grid column span
}

/**
 * View-specific sizing configuration
 * - Week view uses heightPercent & topPercent (row-based)
 * - Month view uses heightPercentMonth & topPercent (fixed stacking)
 */
export interface SizingConfig {
  heightPercent?: number; // week view: height based on duration
  topPercent?: number; // percentage from top
  heightPercentMonth?: number; // month view: fixed height
}

/**
 * Rendering metadata for the positioned event
 */
export interface ViewMetadata {
  dayIndex?: number; // day index within the week
  hiddenCount?: number; // overflow count in month view
  eventStart?: DateTime; // original unclipped start time (for editing)
  eventEnd?: DateTime; // original unclipped end time (for editing)
  rowSpan?: number; // number of grid rows for week view
  sourceId?: string; // original event id before slice id override
  paddingLeft?: number; // px inset from left edge (6 = column edge, 1 = between events)
  paddingRight?: number; // px inset from right edge (6 = column edge, 1 = between events)
}

export interface PositionedEvent extends CalendarEvent {
  layout: PositionLayout;
  sizing: SizingConfig;
  metadata: ViewMetadata;
}
