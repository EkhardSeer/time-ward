import { Component, inject, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CALENDAR_I18N } from '../../models/calendar-i18n';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { EventTimeRangeComponent } from '../event-time-range/event-time-range.component';

export interface EventDialogData {
  mode: 'add' | 'edit';
  event: EventData;
}

export interface EventData {
  title: string;
  start: string;
  end: string;
  color: string;
}

@Component({
  selector: 'app-add-event-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'add' ? i18n.dialogAddTitle : i18n.dialogEditTitle }}</h2>
    <mat-dialog-content>
      <mat-form-field class="title-field">
        <mat-label>{{ i18n.fieldTitle }}</mat-label>
        <input matInput [(ngModel)]="data.event.title" name="title" required autofocus />
      </mat-form-field>

      <app-color-picker
        [color]="data.event.color"
        (colorChange)="data.event.color = $event"
        [label]="i18n.fieldColor"
      />

      <app-event-time-range
        [start]="data.event.start"
        (startChange)="data.event.start = $event"
        [end]="data.event.end"
        (endChange)="data.event.end = $event"
        (validChange)="timeRangeValid = $event"
      />
    </mat-dialog-content>

    <mat-dialog-actions>
      @if (data.mode === 'edit') {
        <button mat-button class="btn-danger" (click)="onDelete()">
          <mat-icon>delete</mat-icon>
          {{ i18n.btnDelete }}
        </button>
      }
      <span class="spacer"></span>
      <button mat-button (click)="onCancel()">{{ i18n.btnCancel }}</button>
      <button
        mat-flat-button
        (click)="onSave()"
        [disabled]="!data.event.title.trim() || !timeRangeValid"
      >
        {{ i18n.btnSave }}
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatIconModule,
    ColorPickerComponent,
    EventTimeRangeComponent,
  ],
  styles: `
    :host mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 440px;
      padding-top: 8px;
    }
    .title-field {
      width: 100%;
    }
    app-color-picker {
      margin: 2px 0 12px;
      display: block;
    }
    mat-dialog-actions {
      display: flex;
      align-items: center;
      padding: 8px;
      gap: 4px;
    }
    .spacer {
      flex: 1;
    }
    .btn-danger {
      color: #c62828;
    }
  `,
})
export class AddEditEventDialogComponent {
  readonly i18n = inject(CALENDAR_I18N);
  timeRangeValid = false;

  constructor(
    public dialogRef: MatDialogRef<AddEditEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventDialogData,
  ) {}

  onSave(): void {
    if (!this.data.event.title.trim()) return;
    this.dialogRef.close(this.data);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onDelete(): void {
    this.dialogRef.close({ ...this.data, delete: true });
  }
}
