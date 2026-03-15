import { DateTime } from 'luxon';
import { CalendarEvent } from './calendar-event';

export const EVENT_MOCK: CalendarEvent[] = [
  // === Today (for reference) ===
  {
    id: 'today-1',
    title: '1',
    start: DateTime.now().startOf('day').plus({ hours: 9 }),
    end: DateTime.now().startOf('day').plus({ hours: 10 }),
    color: '#FF5733',
  },
  {
    id: 'today-2',
    title: '2',
    start: DateTime.now().startOf('day').plus({ hours: 10 }),
    end: DateTime.now().startOf('day').plus({ hours: 11 }),
    color: '#33C1FF',
  },

  // === Day 14 - 6 events to test overflow (should show only 2) ===
  {
    id: '14-a',
    title: '3',
    start: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 9 }),
    end: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 10 }),
    color: '#FF5733',
  },
  {
    id: '14-b',
    title: '4',
    start: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 10 }),
    end: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 11 }),
    color: '#33C1FF',
  },
  {
    id: '14-c',
    title: '5',
    start: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 11 }),
    end: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 12 }),
    color: '#75FF33',
  },
  {
    id: '14-d',
    title: '6',
    start: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 12 }),
    end: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 13 }),
    color: '#FFC300',
  },

  // === MORE EVENTS ON 14th for overflow testing ===
  {
    id: '14-e',
    title: '7',
    start: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 13 }),
    end: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 14 }),
    color: '#DA33FF',
  },
  {
    id: '14-f',
    title: '8',
    start: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 14 }),
    end: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 15 }),
    color: '#33FFB5',
  },

  // === Day 20 with overflow (3 events, show 2 + "+1 more") ===
  {
    id: '20-x',
    title: '9',
    start: DateTime.now().plus({ days: 20 }).startOf('day').plus({ hours: 9 }),
    end: DateTime.now().plus({ days: 20 }).startOf('day').plus({ hours: 10 }),
    color: '#FF5733',
  },
  {
    id: '20-y',
    title: '10',
    start: DateTime.now().plus({ days: 20 }).startOf('day').plus({ hours: 10 }),
    end: DateTime.now().plus({ days: 20 }).startOf('day').plus({ hours: 11 }),
    color: '#33C1FF',
  },
  {
    id: '20-z',
    title: '11',
    start: DateTime.now().plus({ days: 20 }).startOf('day').plus({ hours: 11 }),
    end: DateTime.now().plus({ days: 20 }).startOf('day').plus({ hours: 12 }),
    color: '#75FF33',
  },

  // === MULTI-WEEK EVENTS ===
  {
    id: 'multi-a',
    title: '12',
    start: DateTime.now().plus({ days: 5 }).startOf('day').plus({ hours: 9 }),
    end: DateTime.now().plus({ days: 15 }).startOf('day').plus({ hours: 17 }),
    color: '#FF6B9D',
  },
  {
    id: 'multi-b',
    title: '13',
    start: DateTime.now().plus({ days: 10 }).startOf('day').plus({ hours: 10 }),
    end: DateTime.now().plus({ days: 22 }).startOf('day').plus({ hours: 14 }),
    color: '#C44569',
  },
  {
    id: 'span-c',
    title: '14',
    start: DateTime.now().plus({ days: 2 }).startOf('day').plus({ hours: 8 }),
    end: DateTime.now().plus({ days: 8 }).startOf('day').plus({ hours: 16 }),
    color: '#F8B500',
  },

  // === Day 14 - MORE events for heavy overlap testing ===
  {
    id: '14-g',
    title: '15',
    start: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 9 }),
    end: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 12 }),
    color: '#FF9500',
  },
  {
    id: '14-h',
    title: '16',
    start: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 10 }),
    end: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 13 }),
    color: '#9C27B0',
  },
  {
    id: '14-i',
    title: '17',
    start: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 11 }),
    end: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 14 }),
    color: '#00BCD4',
  },
  {
    id: '14-j',
    title: '18',
    start: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 12 }),
    end: DateTime.now().plus({ days: 14 }).startOf('day').plus({ hours: 15 }),
    color: '#4CAF50',
  },

  // === Day 20 - MORE events for heavy overlap testing ===
  {
    id: '20-a',
    title: '19',
    start: DateTime.now().plus({ days: 20 }).startOf('day').plus({ hours: 9 }),
    end: DateTime.now().plus({ days: 20 }).startOf('day').plus({ hours: 11 }),
    color: '#FF9500',
  },
  {
    id: '20-b',
    title: '20',
    start: DateTime.now().plus({ days: 20 }).startOf('day').plus({ hours: 10 }),
    end: DateTime.now().plus({ days: 20 }).startOf('day').plus({ hours: 12 }),
    color: '#9C27B0',
  },
  {
    id: '20-c',
    title: '21',
    start: DateTime.now().plus({ days: 20 }).startOf('day').plus({ hours: 14 }),
    end: DateTime.now().plus({ days: 20 }).startOf('day').plus({ hours: 16 }),
    color: '#00BCD4',
  },

  // === Day 25 - Heavy overlap test ===
  {
    id: '25-a',
    title: '22',
    start: DateTime.now().plus({ days: 25 }).startOf('day').plus({ hours: 8 }),
    end: DateTime.now().plus({ days: 25 }).startOf('day').plus({ hours: 10 }),
    color: '#FF5733',
  },
  {
    id: '25-b',
    title: '23',
    start: DateTime.now().plus({ days: 25 }).startOf('day').plus({ hours: 9 }),
    end: DateTime.now().plus({ days: 25 }).startOf('day').plus({ hours: 11 }),
    color: '#33C1FF',
  },
  {
    id: '25-c',
    title: '24',
    start: DateTime.now().plus({ days: 25 }).startOf('day').plus({ hours: 10 }),
    end: DateTime.now().plus({ days: 25 }).startOf('day').plus({ hours: 12 }),
    color: '#75FF33',
  },
  {
    id: '25-d',
    title: '25',
    start: DateTime.now().plus({ days: 25 }).startOf('day').plus({ hours: 11 }),
    end: DateTime.now().plus({ days: 25 }).startOf('day').plus({ hours: 13 }),
    color: '#FFC300',
  },
];
