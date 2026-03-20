import { Component, inject, input, output, signal, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CALENDAR_I18N } from '../../models/calendar-i18n';
import { CalendarEvent } from '../../models/calendar-event';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { EventTimeRangeComponent } from '../event-time-range/event-time-range.component';
import { EventData } from '../add-edit-event-dialog/add-edit-event-dialog.component';

@Component({
  selector: 'app-calendar-event-sidebar',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ColorPickerComponent,
    EventTimeRangeComponent,
  ],
  template: `
    <div class="event-details-panel">
      <!-- Sidebar nav header: prev / counter / next / close -->
      <div class="sidebar-nav-header">
        <button mat-icon-button (click)="prevEvent.emit()" [title]="'Previous event'">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <span class="sidebar-nav-counter">
          {{ visibleEvents().indexOf(selectedEvent()) + 1 }} / {{ visibleEvents().length }}
        </span>
        <button mat-icon-button (click)="nextEvent.emit()" [title]="'Next event'">
          <mat-icon>chevron_right</mat-icon>
        </button>
        <span class="sidebar-nav-spacer"></span>
        <button mat-icon-button (click)="closed.emit()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      @if (selectedEvent().sidebarTemplate) {
        <!-- Per-event template (highest priority) -->
        <ng-template
          [ngTemplateOutlet]="selectedEvent().sidebarTemplate!"
          [ngTemplateOutletContext]="{ $implicit: selectedEvent() }"
        />
      } @else if (detailsTemplate()) {
        <!-- Global fallback template -->
        <ng-template
          [ngTemplateOutlet]="detailsTemplate()!"
          [ngTemplateOutletContext]="{ $implicit: selectedEvent() }"
        />
      } @else if (readonly()) {
        <!-- Read-only view: title + time range, no editing controls -->
        <div class="edit-panel-body">
          <div class="readonly-event-title">{{ editDraft()?.title }}</div>
          <app-event-time-range [start]="editDraft()?.start ?? ''" [end]="editDraft()?.end ?? ''" />
        </div>
      } @else {
        <!-- Built-in inline edit form -->
        <div class="edit-panel-header">
          <span class="edit-panel-title">{{ i18n.dialogEditTitle }}</span>
        </div>
        <div class="edit-panel-body">
          <mat-form-field class="edit-title-field">
            <mat-label>{{ i18n.fieldTitle }}</mat-label>
            <input
              matInput
              [ngModel]="editDraft()?.title"
              (ngModelChange)="setDraftField('title', $event)"
              required
              autofocus
            />
          </mat-form-field>
          <app-color-picker
            [color]="editDraft()?.color ?? '#1976d2'"
            (colorChange)="setDraftField('color', $event)"
            [label]="i18n.fieldColor"
          />
          <app-event-time-range
            [start]="editDraft()?.start ?? ''"
            (startChange)="setDraftField('start', $event)"
            [end]="editDraft()?.end ?? ''"
            (endChange)="setDraftField('end', $event)"
            (validChange)="editTimeRangeValid.set($event)"
          />
        </div>
        <div class="edit-panel-actions">
          <button mat-button class="btn-danger" (click)="deleted.emit()">
            <mat-icon>delete</mat-icon> {{ i18n.btnDelete }}
          </button>
          <span class="edit-panel-spacer"></span>
          <button
            mat-flat-button
            (click)="saved.emit()"
            [disabled]="!editDraft()?.title?.trim() || !editTimeRangeValid()"
          >
            {{ i18n.btnSave }}
          </button>
        </div>
      }
    </div>
  `,
})
export class CalendarEventSidebarComponent {
  readonly i18n = inject(CALENDAR_I18N);

  selectedEvent = input.required<CalendarEvent>();
  visibleEvents = input.required<CalendarEvent[]>();
  editDraft = input.required<EventData | null>();
  readonly = input(false);
  detailsTemplate = input<TemplateRef<{ $implicit: CalendarEvent }> | null>(null);

  closed = output<void>();
  prevEvent = output<void>();
  nextEvent = output<void>();
  saved = output<void>();
  deleted = output<void>();
  draftFieldChange = output<{ field: keyof EventData; value: string }>();

  editTimeRangeValid = signal(true);

  setDraftField(field: keyof EventData, value: string): void {
    this.draftFieldChange.emit({ field, value });
  }
}
