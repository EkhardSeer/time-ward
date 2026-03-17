import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { CalendarComponent } from '../../calendar.component';
import { CalendarEvent } from '../../models/calendar-event';

const EVENTS: CalendarEvent[] = [
  {
    id: 'p1',
    title: 'Meeting',
    color: '#1565c0',
    start: DateTime.now().startOf('day').set({ hour: 9 }),
    end: DateTime.now().startOf('day').set({ hour: 10 }),
  },
  {
    id: 'p2',
    title: 'Workshop',
    color: '#2e7d32',
    start: DateTime.now().startOf('day').set({ hour: 13 }),
    end: DateTime.now().startOf('day').set({ hour: 15 }),
  },
  {
    id: 'p3',
    title: 'Review',
    color: '#e65100',
    start: DateTime.now().plus({ days: 1 }).startOf('day').set({ hour: 10 }),
    end: DateTime.now().plus({ days: 1 }).startOf('day').set({ hour: 11 }),
  },
];

@Component({
  selector: 'app-config-demo',
  standalone: true,
  imports: [CalendarComponent, FormsModule, MatSliderModule, MatSlideToggleModule, MatIconModule],
  template: `
    <div class="demo-layout">
      <!-- Controls panel -->
      <div class="controls">
        <div class="controls-header">
          <mat-icon>tune</mat-icon>
          <span>Configuration</span>
        </div>
        <div class="controls-body">
          <div class="control-section">Inputs</div>

          <div class="control-row">
            <mat-slide-toggle [(ngModel)]="readonly">readonly</mat-slide-toggle>
          </div>
          <div class="control-row">
            <mat-slide-toggle [(ngModel)]="showFab">showFab</mat-slide-toggle>
          </div>
          <div class="control-row">
            <mat-slide-toggle [(ngModel)]="showSidebar">showSidebar</mat-slide-toggle>
          </div>
          <div class="control-row">
            <mat-slide-toggle [(ngModel)]="showViewToggle">showViewToggle</mat-slide-toggle>
          </div>

          <div class="control-section">Row Height</div>
          <div class="slider-row">
            <span class="slider-label">{{ rowHeight }}px</span>
            <mat-slider min="12" max="40" step="2" style="flex:1">
              <input matSliderThumb [(ngModel)]="rowHeight" />
            </mat-slider>
          </div>

          <div class="control-section">Initial View</div>
          <div class="view-btns">
            @for (v of views; track v) {
              <button class="view-btn" [class.active]="view === v" (click)="view = v">
                {{ v }}
              </button>
            }
          </div>

          <div class="control-section">Code</div>
          <pre class="code-preview">{{ codePreview() }}</pre>
        </div>
      </div>

      <!-- Live calendar -->
      <app-calendar
        style="flex: 1; min-width: 0; height: 100%"
        [events]="events"
        [readonly]="readonly"
        [showFab]="showFab"
        [showSidebar]="showSidebar"
        [showViewToggle]="showViewToggle"
        [rowHeight]="rowHeight"
        [initialView]="view"
      />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      width: 100%;
      height: 100%;
    }

    .demo-layout {
      display: flex;
      width: 100%;
      height: 100%;
      gap: 16px;
    }

    .controls {
      width: 220px;
      flex-shrink: 0;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .controls-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: var(--mat-sys-primary);
      color: white;
      font-size: 0.9rem;
      font-weight: 500;
      flex-shrink: 0;
    }

    .controls-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .control-section {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(0, 0, 0, 0.38);
      margin-top: 8px;
      margin-bottom: 2px;
    }

    .control-row {
      display: flex;
      align-items: center;
      padding: 2px 0;
    }

    .slider-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .slider-label {
      font-size: 0.8rem;
      font-weight: 600;
      width: 36px;
      flex-shrink: 0;
    }

    .view-btns {
      display: flex;
      gap: 4px;
    }

    .view-btn {
      flex: 1;
      padding: 4px 0;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      background: none;
      font-size: 0.75rem;
      cursor: pointer;
      text-transform: capitalize;
      &.active {
        background: var(--mat-sys-primary);
        color: white;
        border-color: transparent;
      }
    }

    .code-preview {
      background: #f5f5f5;
      border-radius: 4px;
      padding: 8px 10px;
      font-size: 0.68rem;
      line-height: 1.6;
      margin: 0;
      color: #333;
      overflow-x: auto;
      white-space: pre-wrap;
    }
  `,
})
export class ConfigDemoComponent {
  readonly events = EVENTS;
  readonly views = ['month', 'week', 'day'] as const;

  readonly = false;
  showFab = true;
  showSidebar = true;
  showViewToggle = true;
  rowHeight = 20;
  view: 'month' | 'week' | 'day' = 'week';

  codePreview(): string {
    const lines: string[] = ['<app-calendar'];
    if (this.readonly) lines.push('  [readonly]="true"');
    if (!this.showFab) lines.push('  [showFab]="false"');
    if (!this.showSidebar) lines.push('  [showSidebar]="false"');
    if (!this.showViewToggle) lines.push('  [showViewToggle]="false"');
    if (this.rowHeight !== 20) lines.push(`  [rowHeight]="${this.rowHeight}"`);
    if (this.view !== 'month') lines.push(`  initialView="${this.view}"`);
    lines.push('/>');
    return lines.join('\n');
  }
}
