import { DateTime } from 'luxon';
import { CalendarEvent } from './calendar-event';
import { CalendarDayLayout } from './calendar-day-layout';

describe('CalendarDayLayout', () => {
  let layout: CalendarDayLayout;
  const day = DateTime.fromISO('2025-06-15'); // a Sunday

  function makeEvent(
    overrides: Partial<CalendarEvent> & { start: DateTime; end: DateTime },
  ): CalendarEvent {
    return { id: 'e1', title: 'Test', color: '#f00', ...overrides };
  }

  beforeEach(() => {
    layout = new CalendarDayLayout();
  });

  it('should return empty array when no events', () => {
    expect(layout.layoutDay([], day)).toEqual([]);
  });

  it('should position a single event correctly', () => {
    const event = makeEvent({
      start: day.set({ hour: 9 }),
      end: day.set({ hour: 10 }),
    });
    const result = layout.layoutDay([event], day);
    expect(result.length).toBe(1);

    const pos = result[0];
    // 9:00 → row 36  → topPercent = 36/96 * 100 = 37.5%
    expect(pos.sizing.topPercent).toBeCloseTo(37.5);
    // 1 hour = 4 rows → heightPercent = 4/96 * 100 ≈ 4.1667%
    expect(pos.sizing.heightPercent).toBeCloseTo(4.1667, 3);
    // Single event fills full width
    expect(pos.layout.left).toBe(0);
    expect(pos.layout.width).toBe(100);
  });

  it('should exclude events outside the day', () => {
    const yesterday = makeEvent({
      id: 'y',
      start: day.minus({ days: 1 }).set({ hour: 9 }),
      end: day.minus({ days: 1 }).set({ hour: 10 }),
    });
    const tomorrow = makeEvent({
      id: 't',
      start: day.plus({ days: 1 }).set({ hour: 9 }),
      end: day.plus({ days: 1 }).set({ hour: 10 }),
    });
    expect(layout.layoutDay([yesterday, tomorrow], day)).toEqual([]);
  });

  it('should clip events that span beyond the day boundaries', () => {
    const event = makeEvent({
      start: day.minus({ hours: 2 }), // 22:00 previous day
      end: day.set({ hour: 3 }), // 03:00 this day
    });
    const result = layout.layoutDay([event], day);
    expect(result.length).toBe(1);

    // Clipped to 00:00–03:00 → topPercent = 0, heightPercent = 12/96 * 100 = 12.5%
    expect(result[0].sizing.topPercent).toBe(0);
    expect(result[0].sizing.heightPercent).toBeCloseTo(12.5);
  });

  it('should place overlapping events side-by-side', () => {
    const e1 = makeEvent({ id: 'a', start: day.set({ hour: 9 }), end: day.set({ hour: 11 }) });
    const e2 = makeEvent({ id: 'b', start: day.set({ hour: 10 }), end: day.set({ hour: 12 }) });

    const result = layout.layoutDay([e1, e2], day);
    expect(result.length).toBe(2);

    // Each should get 50% width
    expect(result[0].layout.width).toBe(50);
    expect(result[1].layout.width).toBe(50);

    // They should be in different columns
    const lefts = result.map((r) => r.layout.left).sort();
    expect(lefts).toEqual([0, 50]);
  });

  it('should stack non-overlapping events in the same column', () => {
    const e1 = makeEvent({ id: 'a', start: day.set({ hour: 9 }), end: day.set({ hour: 10 }) });
    const e2 = makeEvent({ id: 'b', start: day.set({ hour: 11 }), end: day.set({ hour: 12 }) });

    const result = layout.layoutDay([e1, e2], day);
    expect(result.length).toBe(2);

    // Each occupies full width (no overlap)
    expect(result[0].layout.width).toBe(100);
    expect(result[1].layout.width).toBe(100);
  });

  it('should preserve original event start/end in metadata', () => {
    const event = makeEvent({
      start: day.set({ hour: 14, minute: 30 }),
      end: day.set({ hour: 16 }),
    });
    const result = layout.layoutDay([event], day);
    expect(result[0].metadata.eventStart!.equals(event.start)).toBe(true);
    expect(result[0].metadata.eventEnd!.equals(event.end)).toBe(true);
  });

  it('should handle three-way overlap correctly', () => {
    const e1 = makeEvent({ id: 'a', start: day.set({ hour: 9 }), end: day.set({ hour: 11 }) });
    const e2 = makeEvent({
      id: 'b',
      start: day.set({ hour: 9, minute: 30 }),
      end: day.set({ hour: 10, minute: 30 }),
    });
    const e3 = makeEvent({ id: 'c', start: day.set({ hour: 10 }), end: day.set({ hour: 12 }) });

    const result = layout.layoutDay([e1, e2, e3], day);
    expect(result.length).toBe(3);

    // All three overlap → each gets ~33.33% width
    const widths = result.map((r) => r.layout.width);
    for (const w of widths) {
      expect(w).toBeCloseTo(33.333, 2);
    }
  });
});
