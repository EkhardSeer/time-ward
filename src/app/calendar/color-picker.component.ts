import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export const COLOR_PICKER_DEFAULTS = [
  '#1976d2',
  '#0097a7',
  '#388e3c',
  '#f57c00',
  '#d32f2f',
  '#7b1fa2',
  '#fbc02d',
  '#455a64',
];

/**
 * Standalone color picker with preset swatches and a custom color escape hatch.
 *
 * Usage:
 *   <app-color-picker [(color)]="myColor" label="Farbe" />
 *   <app-color-picker [(color)]="myColor" [presetColors]="myPalette" />
 */
@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <div class="color-row">
      @if (label()) {
        <span class="color-label">{{ label() }}</span>
      }
      <div class="color-swatches">
        @for (c of presetColors(); track c) {
          <button
            type="button"
            class="swatch"
            [style.background]="c"
            [class.swatch-selected]="color() === c"
            (click)="color.set(c)"
          ></button>
        }
        <label class="swatch swatch-custom" [class.swatch-selected]="isCustomColor()">
          <mat-icon class="colorize-icon">colorize</mat-icon>
          <input
            type="color"
            class="hidden-color-input"
            [ngModel]="color()"
            (ngModelChange)="color.set($event)"
            [ngModelOptions]="{ standalone: true }"
          />
        </label>
      </div>
      <div class="color-preview" [style.background]="color()"></div>
    </div>
  `,
  styles: `
    .color-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .color-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .color-swatches {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }
    .swatch {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      padding: 0;
      transition:
        transform 0.1s ease,
        box-shadow 0.1s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .swatch:hover {
      transform: scale(1.2);
    }
    .swatch-selected {
      border-color: white;
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.45);
    }
    .swatch-custom {
      background: #e0e0e0;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }
    .colorize-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      line-height: 14px;
      color: rgba(0, 0, 0, 0.55);
      pointer-events: none;
    }
    .hidden-color-input {
      opacity: 0;
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
      border: none;
      padding: 0;
    }
    .color-preview {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid rgba(0, 0, 0, 0.15);
      margin-left: auto;
      flex-shrink: 0;
    }
  `,
})
export class ColorPickerComponent {
  /** Currently selected color (hex string). Supports two-way binding: [(color)]. */
  color = model<string>('#1976d2');

  /** Optional label shown to the left of the swatches. */
  label = input<string>('');

  /** Preset color swatches. Falls back to a curated 8-color palette. */
  presetColors = input<string[]>(COLOR_PICKER_DEFAULTS);

  isCustomColor(): boolean {
    return !this.presetColors().includes(this.color());
  }
}
