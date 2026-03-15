import { DateTime } from 'luxon';
import { CalendarEvent } from './calendar-event';
import { CalendarMonthLayout } from './calendar-month-layout';

describe('CalendarMonthLayout', () => {
  let layout: CalendarMonthLayout;
  // June 2025 starts on a Sunday (ISO week starts Monday → first week row starts 26 May)
  const june2025 = DateTime.fromISO('2025-06-01');

  function makeEvent(
    overrides: Partial<CalendarEvent> & { start: DateTime; end: DateTime },
  ): CalendarEvent {
    return { id: 'e1', title: 'Test', color: '#f00', ...overrides };
  }

  beforeEach(() => {
    layout = new CalendarMonthLayout();
  });

  // ── generateMonth ────────────────────────────────────────────────

  describe('generateMonth', () => {
    it('should return an array of 7-day weeks', () => {
      const weeks = layout.generateMonth(june2025);
      expect(weeks.length).toBeGreaterThanOrEqual(4);
      expect(weeks.length).toBeLessThanOrEqual(6);
      for (const week of weeks) {
        expect(week.length).toBe(7);
      }
    });

    it('should start each week on Monday (ISO)', () => {
      const weeks = layout.generateMonth(june2025);
      for (const week of weeks) {
        expect(week[0].weekday).toBe(1); // Monday
      }
    });

    it('should include the 1st and last day of the month', () => {
      const weeks = layout.generateMonth(june2025);
      const allDays = weeks.flat();
      const hasFirst = allDays.some((d) => d.month === 6 && d.day === 1);
      const hasLast = allDays.some((d) => d.month === 6 && d.day === 30);
      expect(hasFirst).toBe(true);
      expect(hasLast).toBe(true);
    });
  });

  // ── layoutMonth ──────────────────────────────────────────────────

  describe('layoutMonth', () => {
    it('should return empty array when no events', () => {
      const weeks = layout.generateMonth(june2025);
      expect(layout.layoutMonth([], weeks)).toEqual([]);
    });

    it('should position a single within-day event', () => {
      const weeks = layout.generateMonth(june2025);
      const event = makeEvent({
        start: june2025.set({ hour: 9 }),
        end: june2025.set({ hour: 10 }),
      });

      const result = layout.layoutMonth([event], weeks);
      expect(result.length).toBe(1);

      const pos = result[0];
      expect(pos.sizing.topPercent).toBeDefined();
      expect(pos.sizing.heightPercentMonth).toBeDefined();
      expect(pos.layout.colSpan).toBe(1);
    });

    it('should create overflow badges when exceeding MAX_VISIBLE per day', () => {
      const weeks = layout.generateMonth(june2025);
      // Create 5 non-overlapping events on the same day
      const events: CalendarEvent[] = [];
      for (let i = 0; i < 5; i++) {
        events.push(
          makeEvent({
            id: `e${i}`,
            start: june2025.set({ hour: 8 + i }),
            end: june2025.set({ hour: 9 + i }),
          }),
        );
      }

      const result = layout.layoutMonth(events, weeks);

      // Should have 3 visible + 1 overflow badge = 4
      const overflow = result.filter((e) => e.metadata.hiddenCount && e.metadata.hiddenCount > 0);
      expect(overflow.length).toBe(1);
      expect(overflow[0].metadata.hiddenCount).toBe(2); // 5 - 3 = 2 hidden
    });

    it('should split multi-week events into separate positioned segments', () => {
      const weeks = layout.generateMonth(june2025);
      // Event spanning from Jun 1 to Jun 15 (crosses multiple weeks)
      const event = makeEvent({
        start: june2025.set({ hour: 9 }),
        end: june2025.plus({ days: 14 }).set({ hour: 17 }),
      });

      const result = layout.layoutMonth([event], weeks);
      // Should have at least 2 segments (one per week it spans)
      expect(result.length).toBeGreaterThanOrEqual(2);

      // Each segment should reference the same event title
      for (const pos of result) {
        expect(pos.title).toBe('Test');
      }
    });

    it('should exclude events outside the visible month', () => {
      const weeks = layout.generateMonth(june2025);
      const event = makeEvent({
        start: DateTime.fromISO('2025-03-01T09:00'),
        end: DateTime.fromISO('2025-03-01T10:00'),
      });

      const result = layout.layoutMonth([event], weeks);
      expect(result.length).toBe(0);
    });

    it('should handle events that start before the visible range', () => {
      const weeks = layout.generateMonth(june2025);
      // Event starts well before the month but ends within it
      const event = makeEvent({
        start: DateTime.fromISO('2025-05-01T09:00'),
        end: june2025.set({ hour: 17 }),
      });

      const result = layout.layoutMonth([event], weeks);
      expect(result.length).toBeGreaterThanOrEqual(1);

      // First segment should start at the beginning of the visible range
      expect(result[0].layout.left).toBeCloseTo(0);
    });
  });
});
