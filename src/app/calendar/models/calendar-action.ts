/**
 * A single entry in a calendar event's context action menu.
 *
 * Pass an array of `CalendarAction` objects either to the `[actions]` input
 * (applies to all events as a default) or to `CalendarEvent.actions`
 * (per-event override that replaces the global default for that event).
 *
 * When the user clicks an action, the calendar emits `actionTriggered` with
 * both the action and the source `CalendarEvent`.
 *
 * @example
 * ```ts
 * const actions: CalendarAction[] = [
 *   { id: 'view',   label: 'View details', icon: 'open_in_new' },
 *   { id: 'edit',   label: 'Edit',         icon: 'edit' },
 *   { id: 'delete', label: 'Delete',        icon: 'delete', divider: true },
 * ];
 * ```
 */
export interface CalendarAction {
  /** Stable identifier returned in the `actionTriggered` output. */
  id: string;
  /** Label displayed in the menu item. */
  label: string;
  /** Optional Material icon name shown to the left of the label. */
  icon?: string;
  /** When `true`, renders a visual separator above this menu item. */
  divider?: boolean;
}
