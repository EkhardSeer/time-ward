import { DateTime } from 'luxon';
import { CalendarEvent } from '../../models/calendar-event';
import { CalendarWeekLayout } from './calendar-week-layout';

describe('CalendarWeekLayout', () => {
  let layout: CalendarWeekLayout;
  // Monday 2025-06-16
  const monday = DateTime.fromISO('2025-06-16');

  function makeEvent(
    overrides: Partial<CalendarEvent> & { start: DateTime; end: DateTime },
  ): CalendarEvent {
    return { id: 'e1', title: 'Test', color: '#f00', ...overrides };
  }

  beforeEach(() => {
    layout = new CalendarWeekLayout();
  });

  // ── generateWeek ─────────────────────────────────────────────────

  describe('generateWeek', () => {
    it('should return 7 consecutive days starting from Monday', () => {
      const week = layout.generateWeek(monday);
      expect(week.length).toBe(7);
      expect(week[0].weekday).toBe(1); // Monday
      expect(week[6].weekday).toBe(7); // Sunday
    });

    it('should snap any date to the start of its ISO week', () => {
      // Wednesday in the same week
      const wednesday = monday.plus({ days: 2 });
      const week = layout.generateWeek(wednesday);
      expect(week[0].equals(monday)).toBe(true);
    });
  });

  // ── layoutWeek ───────────────────────────────────────────────────

  describe('layoutWeek', () => {
    it('should return empty array when no events', () => {
      const week = layout.generateWeek(monday);
      expect(layout.layoutWeek([], week)).toEqual([]);
    });

    it('should position a single event on the correct day column', () => {
      const week = layout.generateWeek(monday);
      // Tuesday 10:00–11:00
      const tues = monday.plus({ days: 1 });
      const event = makeEvent({
        start: tues.set({ hour: 10 }),
        end: tues.set({ hour: 11 }),
      });

      const result = layout.layoutWeek([event], week);
      expect(result.length).toBe(1);

      const pos = result[0];
      // Day 1 (Tuesday) → left starts at 1 * (100/7) ≈ 14.2857%
      const dayWidth = 100 / 7;
      expect(pos.layout.left).toBeCloseTo(dayWidth);
      expect(pos.layout.width).toBeCloseTo(dayWidth);
      expect(pos.metadata.dayIndex).toBe(1);
    });

    it('should exclude events outside the week', () => {
      const week = layout.generateWeek(monday);
      const event = makeEvent({
        start: monday.minus({ weeks: 1 }).set({ hour: 9 }),
        end: monday.minus({ weeks: 1 }).set({ hour: 10 }),
      });
      expect(layout.layoutWeek([event], week)).toEqual([]);
    });

    it('should split multi-day events into per-day slices', () => {
      const week = layout.generateWeek(monday);
      // Monday 22:00 → Wednesday 02:00 spans 3 days
      const event = makeEvent({
        start: monday.set({ hour: 22 }),
        end: monday.plus({ days: 2 }).set({ hour: 2 }),
      });

      const result = layout.layoutWeek([event], week);
      expect(result.length).toBe(3); // Mon, Tue, Wed slices

      // All slices share the same sourceId
      for (const pos of result) {
        expect(pos.metadata.sourceId).toBe(event.id);
      }
    });

    it('should place overlapping same-day events side-by-side', () => {
      const week = layout.generateWeek(monday);
      const e1 = makeEvent({
        id: 'a',
        start: monday.set({ hour: 9 }),
        end: monday.set({ hour: 11 }),
      });
      const e2 = makeEvent({
        id: 'b',
        start: monday.set({ hour: 10 }),
        end: monday.set({ hour: 12 }),
      });

      const result = layout.layoutWeek([e1, e2], week);
      expect(result.length).toBe(2);

      const dayWidth = 100 / 7;
      // Each should take half the day column width
      for (const pos of result) {
        expect(pos.layout.width).toBeCloseTo(dayWidth / 2);
      }
    });

    it('should preserve original event times in metadata', () => {
      const week = layout.generateWeek(monday);
      const event = makeEvent({
        start: monday.set({ hour: 14 }),
        end: monday.set({ hour: 16 }),
      });

      const result = layout.layoutWeek([event], week);
      expect(result[0].metadata.eventStart!.equals(event.start)).toBe(true);
      expect(result[0].metadata.eventEnd!.equals(event.end)).toBe(true);
    });
  });
});
