import { Component, ViewChild, computed, effect, inject, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepicker, MatTimepickerModule } from '@angular/material/timepicker';
import { MatIconModule } from '@angular/material/icon';
import { CALENDAR_I18N } from './calendar-i18n';
import { DateTime } from 'luxon';
import { MatButtonModule } from '@angular/material/button';

export interface DurationOption {
  minutes: number;
  label: string;
}

export const DEFAULT_DURATIONS: DurationOption[] = [
  { minutes: 15, label: "15'" },
  { minutes: 30, label: "30'" },
  { minutes: 45, label: "45'" },
  { minutes: 60, label: '1 h' },
  { minutes: 90, label: '1:30' },
  { minutes: 120, label: '2 h' },
  { minutes: 180, label: '3 h' },
  { minutes: 240, label: '4 h' },
];

/**
 * Start/end date-time range picker with duration quick-select chips.
 * Strings are sourced from CALENDAR_I18N — override the token to customise labels.
 *
 * Usage:
 *   <app-event-time-range [(start)]="isoStart" [(end)]="isoEnd" />
 *
 * Both start and end are ISO-8601 strings formatted as "yyyy-MM-dd'T'HH:mm".
 * Adjusting start preserves the current duration; duration chips set end relative to start.
 */
@Component({
  selector: 'app-event-time-range',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="time-section">
      <!-- Start row -->
      <div class="time-row">
        <mat-form-field>
          <mat-label>{{ i18n.fieldStartDate }}</mat-label>
          <input
            matInput
            [matDatepicker]="startDatePicker"
            [ngModel]="start()"
            (ngModelChange)="onStartChange($event)"
            [ngModelOptions]="{ standalone: true }"
          />
          <mat-datepicker-toggle matIconSuffix [for]="startDatePicker"></mat-datepicker-toggle>
          <mat-datepicker #startDatePicker>
            <mat-datepicker-actions>
              <button matButton matDatepickerCancel>{{ i18n.datepickerCancel }}</button>
              <button matButton="elevated" matDatepickerApply>{{ i18n.datepickerApply }}</button>
            </mat-datepicker-actions>
          </mat-datepicker>
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ i18n.fieldStartTime }}</mat-label>
          <input
            matInput
            [matTimepicker]="startTimePicker"
            [ngModel]="start()"
            (ngModelChange)="onStartChange($event)"
            [ngModelOptions]="{ standalone: true }"
          />
          <mat-timepicker-toggle matIconSuffix [for]="startTimePicker" />
          <mat-timepicker interval="15min" #startTimePicker />
        </mat-form-field>
      </div>

      <!-- Duration bar -->
      <div class="duration-bar">
        <mat-icon class="dur-arrow">arrow_downward</mat-icon>
        <span class="dur-label">{{ i18n.fieldDuration }}:</span>
        <div class="dur-chips">
          @for (d of durations; track d.minutes) {
            <button
              type="button"
              class="dur-chip"
              [class.dur-chip-active]="currentDurationMinutes === d.minutes"
              (click)="setDuration(d.minutes)"
            >
              {{ d.label }}
            </button>
          }
        </div>
      </div>

      <!-- End row -->
      <div class="time-row">
        <mat-form-field>
          <mat-label>{{ i18n.fieldEndDate }}</mat-label>
          <input
            matInput
            [matDatepicker]="endDatePicker"
            [ngModel]="end()"
            (ngModelChange)="onEndChange($event)"
            [ngModelOptions]="{ standalone: true }"
            [min]="startDt()"
          />
          <mat-datepicker-toggle matIconSuffix [for]="endDatePicker"></mat-datepicker-toggle>
          <mat-datepicker #endDatePicker>
            <mat-datepicker-actions>
              <button matButton matDatepickerCancel>{{ i18n.datepickerCancel }}</button>
              <button matButton="elevated" matDatepickerApply>{{ i18n.datepickerApply }}</button>
            </mat-datepicker-actions>
          </mat-datepicker>
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ i18n.fieldEndTime }}</mat-label>
          <input
            matInput
            [matTimepicker]="endTimePicker"
            [ngModel]="end()"
            (ngModelChange)="onEndChange($event)"
            [ngModelOptions]="{ standalone: true }"
          />
          <mat-timepicker-toggle matIconSuffix [for]="endTimePicker" />
          <mat-timepicker interval="15min" #endTimePicker />
        </mat-form-field>
      </div>
    </div>
  `,
  styles: `
    .time-section {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .time-row {
      display: flex;
      gap: 8px;
    }
    .time-row mat-form-field {
      flex: 1;
    }
    .duration-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 2px 0 6px 4px;
    }
    .dur-arrow {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: rgba(0, 0, 0, 0.35);
      flex-shrink: 0;
    }
    .dur-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .dur-chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .dur-chip {
      padding: 2px 10px;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.2);
      background: transparent;
      font-size: 12px;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.7);
      line-height: 20px;
      transition:
        background 0.1s ease,
        border-color 0.1s ease,
        color 0.1s ease;
    }
    .dur-chip:hover {
      background: rgba(0, 0, 0, 0.06);
      border-color: rgba(0, 0, 0, 0.35);
    }
    .dur-chip-active {
      background: var(--mdc-filled-button-container-color, #1976d2) !important;
      border-color: transparent !important;
      color: white !important;
    }
  `,
})
export class EventTimeRangeComponent {
  readonly i18n = inject(CALENDAR_I18N);

  @ViewChild('endTimePicker') private _endTimePicker!: MatTimepicker<DateTime>;

  /** ISO-8601 start datetime string ("yyyy-MM-dd'T'HH:mm"). Supports [(start)]. */
  start = model<string>('');

  /** ISO-8601 end datetime string ("yyyy-MM-dd'T'HH:mm"). Supports [(end)]. */
  end = model<string>('');

  /** Emits true when start and end form a valid range (end > start). */
  validChange = output<boolean>();

  readonly durations: DurationOption[] = DEFAULT_DURATIONS;

  /** True when both datetimes are valid and end is strictly after start. */
  valid = computed(() => {
    const s = this.toDt(this.start());
    const e = this.toDt(this.end());
    return s.isValid && e.isValid && e.toMillis() > s.toMillis();
  });

  constructor() {
    effect(() => this.validChange.emit(this.valid()));
  }

  /** Parsed start as a Luxon DateTime — used as [min] on the end datepicker to gray out earlier dates. */
  startDt = computed(() => {
    const dt = this.toDt(this.start());
    return dt.isValid ? dt : null;
  });

  /** Returns the current event duration in minutes, or null if undetermined. */
  get currentDurationMinutes(): number | null {
    const s = this.toDt(this.start());
    const e = this.toDt(this.end());
    if (!s.isValid || !e.isValid) return null;
    const diff = e.diff(s, 'minutes').minutes;
    return diff > 0 ? diff : null;
  }

  /** Sets end = start + given minutes. */
  setDuration(minutes: number): void {
    const s = this.toDt(this.start());
    if (!s.isValid) return;
    this.end.set(s.plus({ minutes }).toFormat("yyyy-MM-dd'T'HH:mm"));
  }

  /** Updates start and preserves the current duration by shifting end accordingly. */
  onStartChange(newStart: unknown): void {
    const s = this.toDt(newStart);
    if (!s.isValid) return;
    const duration = this.currentDurationMinutes;
    this.start.set(s.toFormat("yyyy-MM-dd'T'HH:mm"));
    if (duration !== null) {
      this.end.set(s.plus({ minutes: duration }).toFormat("yyyy-MM-dd'T'HH:mm"));
    }
  }

  /**
   * Clamps end to at least start + 15 min.
   * When clamping is required we force-close the timepicker first and defer
   * the signal update to the next task, so Angular's writeValue runs outside
   * the picker's own event cycle (where it would otherwise be suppressed).
   */
  onEndChange(newEnd: unknown): void {
    const s = this.toDt(this.start());
    const e = this.toDt(newEnd);
    if (!s.isValid || !e.isValid) return;
    if (e.toMillis() <= s.toMillis()) {
      const clampedISO = s.plus({ minutes: 15 }).toFormat("yyyy-MM-dd'T'HH:mm");
      this._endTimePicker?.close();
      setTimeout(() => this.end.set(clampedISO));
    } else {
      this.end.set(e.toFormat("yyyy-MM-dd'T'HH:mm"));
    }
  }

  /** Normalises a picker-emitted DateTime or an ISO string into a Luxon DateTime. */
  private toDt(val: unknown): DateTime {
    if (DateTime.isDateTime(val)) return val as DateTime;
    return DateTime.fromISO(val as string);
  }
}
