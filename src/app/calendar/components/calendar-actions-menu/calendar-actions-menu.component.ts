import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CalendarAction } from '../../models/calendar-action';

@Component({
  selector: 'app-calendar-actions-menu',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule],
  template: `
    <button
      mat-icon-button
      class="toolbar-actions-btn"
      [matMenuTriggerFor]="calendarActionsMenu"
      title="Actions"
    >
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #calendarActionsMenu="matMenu">
      @for (action of actions(); track action.id) {
        @if (action.divider) {
          <mat-divider />
        }
        <button mat-menu-item (click)="onAction(action, $event)">
          @if (action.icon) {
            <mat-icon>{{ action.icon }}</mat-icon>
          }
          <span>{{ action.label }}</span>
        </button>
      }
    </mat-menu>
  `,
})
export class CalendarActionsMenuComponent {
  actions = input.required<CalendarAction[]>();

  actionTriggered = output<CalendarAction>();

  onAction(action: CalendarAction, event: MouseEvent): void {
    event.stopPropagation();
    this.actionTriggered.emit(action);
  }
}
