import { InjectionToken } from '@angular/core';

/**
 * All user-facing strings for the calendar feature.
 * Provide CALENDAR_I18N in your app to override the default (German).
 *
 * Example (app.config.ts):
 *   providers: [{ provide: CALENDAR_I18N, useValue: EN_CALENDAR_I18N }]
 */
export interface CalendarI18n {
  // Toolbar view toggles
  viewMonth: string;
  viewWeek: string;
  viewDay: string;

  // Week number prefix shown in the header badge
  weekPrefix: string;

  // Luxon locale string used for date formatting
  locale: string;

  // Weekday column headers in month view (Monday → Sunday)
  weekdays: [string, string, string, string, string, string, string];

  // Add/Edit event dialog
  dialogAddTitle: string;
  dialogEditTitle: string;
  fieldTitle: string;
  fieldColor: string;
  fieldStartDate: string;
  fieldStartTime: string;
  fieldEndDate: string;
  fieldEndTime: string;
  fieldDuration: string;
  dateHint: string;
  datepickerCancel: string;
  datepickerApply: string;
  btnDelete: string;
  btnCancel: string;
  btnSave: string;
}

export const DE_CALENDAR_I18N: CalendarI18n = {
  viewMonth: 'Monat',
  viewWeek: 'Woche',
  viewDay: 'Tag',
  weekPrefix: 'KW',
  locale: 'de',
  weekdays: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
  dialogAddTitle: 'Termin hinzufügen',
  dialogEditTitle: 'Termin bearbeiten',
  fieldTitle: 'Bezeichnung',
  fieldColor: 'Farbe',
  fieldStartDate: 'Startdatum',
  fieldStartTime: 'Startzeit',
  fieldEndDate: 'Enddatum',
  fieldEndTime: 'Endzeit',
  fieldDuration: 'Dauer',
  dateHint: 'TT.MM.JJJJ',
  datepickerCancel: 'Abbrechen',
  datepickerApply: 'Übernehmen',
  btnDelete: 'Löschen',
  btnCancel: 'Abbrechen',
  btnSave: 'Speichern',
};

export const EN_CALENDAR_I18N: CalendarI18n = {
  viewMonth: 'Month',
  viewWeek: 'Week',
  viewDay: 'Day',
  weekPrefix: 'W',
  locale: 'en',
  weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  dialogAddTitle: 'Add Event',
  dialogEditTitle: 'Edit Event',
  fieldTitle: 'Event Name',
  fieldColor: 'Color',
  fieldStartDate: 'Start Date',
  fieldStartTime: 'Start Time',
  fieldEndDate: 'End Date',
  fieldEndTime: 'End Time',
  fieldDuration: 'Duration',
  dateHint: 'MM/DD/YYYY',
  datepickerCancel: 'Cancel',
  datepickerApply: 'Apply',
  btnDelete: 'Delete',
  btnCancel: 'Cancel',
  btnSave: 'Save',
};

export const CALENDAR_I18N = new InjectionToken<CalendarI18n>('CALENDAR_I18N', {
  providedIn: 'root',
  factory: () => DE_CALENDAR_I18N,
});
