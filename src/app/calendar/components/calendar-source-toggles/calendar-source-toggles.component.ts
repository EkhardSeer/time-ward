import { Component, input, output } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CalendarSource } from '../../models/calendar-source';

@Component({
  selector: 'app-calendar-source-toggles',
  standalone: true,
  imports: [CdkDropList, CdkDrag],
  template: `
    <div
      class="calendar-source-toggles"
      cdkDropList
      cdkDropListOrientation="horizontal"
      [cdkDropListDisabled]="!reorderableCalendars()"
      (cdkDropListDropped)="onDrop($event)"
    >
      @for (source of sources(); track source.id) {
        <button
          cdkDrag
          [cdkDragDisabled]="!reorderableCalendars()"
          class="calendar-source-chip"
          [class.disabled]="disabledIds().has(source.id)"
          [style.--source-color]="source.color"
          (click)="onChipClick(source.id)"
          [title]="disabledIds().has(source.id) ? 'Show ' + source.label : 'Hide ' + source.label"
        >
          <span class="chip-dot"></span>
          <span class="chip-label">{{ source.label }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    .calendar-source-toggles {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-right: 12px;
      flex-wrap: wrap;

      &.cdk-drop-list-dragging .calendar-source-chip:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
    }

    .calendar-source-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px 3px 6px;
      border-radius: 16px;
      border: 2px solid var(--source-color, currentColor);
      background: transparent;
      color: inherit;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition:
        opacity 0.15s,
        background 0.15s;
      white-space: nowrap;

      .chip-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: var(--source-color, currentColor);
        flex-shrink: 0;
        transition: opacity 0.15s;
      }

      &.disabled {
        opacity: 0.45;

        .chip-dot {
          background-color: transparent;
          border: 2px solid var(--source-color, currentColor);
        }
      }

      &:hover:not(.disabled) {
        background: rgba(255, 255, 255, 0.15);
      }

      &.cdk-drag-placeholder {
        opacity: 0.3;
      }

      &.cdk-drag-preview {
        border-radius: 16px;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.24);
      }
    }
  `,
})
export class CalendarSourceTogglesComponent {
  sources = input.required<CalendarSource[]>();
  reorderableCalendars = input(false);
  disabledIds = input.required<Set<string>>();

  toggled = output<string>();
  dropped = output<CdkDragDrop<CalendarSource[]>>();

  private _suppressClick = false;

  onChipClick(id: string): void {
    if (this._suppressClick) {
      this._suppressClick = false;
      return;
    }
    this.toggled.emit(id);
  }

  onDrop(event: CdkDragDrop<CalendarSource[]>): void {
    this._suppressClick = true;
    this.dropped.emit(event);
  }
}
