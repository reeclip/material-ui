import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  effect,
  inject,
  HostListener,
  LOCALE_ID,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { CalendarPanelComponent } from './calendar-panel.component';

/**
 * Configuration for the DesktopDatePicker component.
 */
export interface DesktopDatePickerConfig {
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** First day of the week (0 = Sunday, 1 = Monday, etc.) */
  firstDayOfWeek?: number;
  /** Date format string for display */
  dateFormat?: string;
}

/**
 * DesktopDatePicker — an Angular port of MUI's DesktopDatePicker.
 *
 * Opens a calendar popover anchored to a text input field.
 * Uses standalone component APIs, signals, CDK Overlay for positioning,
 * and implements ControlValueAccessor for reactive/template-driven form support.
 *
 * @example
 * ```html
 * <mui-desktop-date-picker
 *   label="Select date"
 *   [(ngModel)]="selectedDate"
 *   [minDate]="minDate"
 *   [maxDate]="maxDate"
 *   [disabled]="false"
 * />
 * ```
 */
@Component({
  selector: 'mui-desktop-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayModule, CalendarPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DesktopDatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="mui-desktop-date-picker" #pickerContainer>
      <label
        *ngIf="label"
        class="mui-date-picker-label"
        [class.mui-label-float]="isOpen() || !!displayValue()"
        [class.mui-label-focused]="isOpen()"
        [class.mui-label-disabled]="disabled"
        [attr.for]="inputId"
      >
        {{ label }}
      </label>

      <div
        class="mui-date-picker-input-wrapper"
        [class.mui-focused]="isOpen()"
        [class.mui-disabled]="disabled"
        [class.mui-error]="!!error"
      >
        <input
          #inputEl
          [id]="inputId"
          type="text"
          class="mui-date-picker-input"
          [value]="displayValue()"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readOnly]="readOnly"
          (click)="openPicker()"
          (input)="onInputChange($event)"
          (blur)="onTouched()"
          autocomplete="off"
          [attr.aria-label]="ariaLabel || label"
          [attr.aria-haspopup]="'dialog'"
          [attr.aria-expanded]="isOpen()"
          role="combobox"
        />
        <button
          type="button"
          class="mui-date-picker-toggle"
          [disabled]="disabled"
          (click)="togglePicker()"
          aria-label="Open date picker"
          tabindex="-1"
        >
          <svg
            class="mui-calendar-icon"
            focusable="false"
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path
              d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11
                 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0
                 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3
                 18H5V8h14v11z"
            />
          </svg>
        </button>
      </div>

      <span *ngIf="helperText || error" class="mui-date-picker-helper-text" [class.mui-error]="!!error">
        {{ error || helperText }}
      </span>
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="pickerContainer"
      [cdkConnectedOverlayOpen]="isOpen()"
      [cdkConnectedOverlayPositions]="overlayPositions"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="closePicker()"
      (detach)="closePicker()"
    >
      <mui-calendar-panel
        [value]="selectedDate()"
        [minDate]="minDate"
        [maxDate]="maxDate"
        [firstDayOfWeek]="firstDayOfWeek"
        (dateSelected)="onDateSelected($event)"
      />
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        font-family: Roboto, 'Helvetica Neue', sans-serif;
      }

      .mui-desktop-date-picker {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        min-width: 200px;
      }

      .mui-date-picker-label {
        position: absolute;
        top: 16px;
        left: 12px;
        font-size: 16px;
        color: rgba(0, 0, 0, 0.6);
        pointer-events: none;
        transition: transform 200ms cubic-bezier(0, 0, 0.2, 1),
          color 200ms cubic-bezier(0, 0, 0.2, 1),
          font-size 200ms cubic-bezier(0, 0, 0.2, 1);
        transform-origin: top left;
      }

      .mui-label-float {
        transform: translate(0, -12px) scale(0.75);
      }

      .mui-label-focused {
        color: #1976d2;
      }

      .mui-label-disabled {
        color: rgba(0, 0, 0, 0.38);
      }

      .mui-date-picker-input-wrapper {
        display: flex;
        align-items: center;
        border: 1px solid rgba(0, 0, 0, 0.23);
        border-radius: 4px;
        padding: 0;
        transition: border-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
        background: #fff;
      }

      .mui-date-picker-input-wrapper:hover:not(.mui-disabled):not(.mui-error) {
        border-color: rgba(0, 0, 0, 0.87);
      }

      .mui-date-picker-input-wrapper.mui-focused {
        border-color: #1976d2;
        border-width: 2px;
      }

      .mui-date-picker-input-wrapper.mui-error {
        border-color: #d32f2f;
      }

      .mui-date-picker-input-wrapper.mui-disabled {
        border-color: rgba(0, 0, 0, 0.12);
        background: rgba(0, 0, 0, 0.04);
      }

      .mui-date-picker-input {
        flex: 1;
        border: none;
        outline: none;
        padding: 16.5px 14px;
        font-size: 16px;
        font-family: inherit;
        color: rgba(0, 0, 0, 0.87);
        background: transparent;
        cursor: pointer;
      }

      .mui-date-picker-input:disabled {
        color: rgba(0, 0, 0, 0.38);
        cursor: default;
      }

      .mui-date-picker-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: none;
        padding: 8px;
        margin-right: 4px;
        cursor: pointer;
        border-radius: 50%;
        color: rgba(0, 0, 0, 0.54);
        transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .mui-date-picker-toggle:hover:not(:disabled) {
        background-color: rgba(0, 0, 0, 0.04);
      }

      .mui-date-picker-toggle:disabled {
        color: rgba(0, 0, 0, 0.26);
        cursor: default;
      }

      .mui-calendar-icon {
        fill: currentColor;
      }

      .mui-date-picker-helper-text {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.6);
        margin: 3px 14px 0;
        line-height: 1.66;
      }

      .mui-date-picker-helper-text.mui-error {
        color: #d32f2f;
      }
    `,
  ],
})
export class DesktopDatePickerComponent implements ControlValueAccessor {
  private readonly locale = inject(LOCALE_ID);

  /** Label text displayed above the input */
  @Input() label = '';

  /** Placeholder text when no date is selected */
  @Input() placeholder = 'mm/dd/yyyy';

  /** Whether the picker is disabled */
  @Input() disabled = false;

  /** Whether the input is read-only (can only pick from calendar) */
  @Input() readOnly = false;

  /** Minimum selectable date */
  @Input() minDate?: Date;

  /** Maximum selectable date */
  @Input() maxDate?: Date;

  /** First day of the week (0 = Sunday, 1 = Monday) */
  @Input() firstDayOfWeek = 0;

  /** Date format for display (simple built-in formatting) */
  @Input() dateFormat = 'MM/dd/yyyy';

  /** Helper text displayed below the input */
  @Input() helperText = '';

  /** Error message — when set, the input shows error styling */
  @Input() error = '';

  /** Accessible label for the input */
  @Input() ariaLabel = '';

  /** Unique ID for the input element */
  @Input() inputId = `mui-date-picker-${DesktopDatePickerComponent.nextId++}`;

  /** Emitted when the selected date changes */
  @Output() dateChange = new EventEmitter<Date | null>();

  /** Emitted when the picker opens */
  @Output() opened = new EventEmitter<void>();

  /** Emitted when the picker closes */
  @Output() closed = new EventEmitter<void>();

  @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;

  private static nextId = 0;

  /** Whether the calendar popover is open */
  readonly isOpen = signal(false);

  /** The currently selected date */
  readonly selectedDate = signal<Date | null>(null);

  /** Formatted display value derived from the selected date */
  readonly displayValue = computed(() => {
    const date = this.selectedDate();
    if (!date) return '';
    return this.formatDate(date);
  });

  /** CDK Overlay preferred positions — below-start, then above-start */
  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
    },
  ];

  // ControlValueAccessor callbacks
  private onChange: (value: Date | null) => void = () => {};
  onTouched: () => void = () => {};

  // -- ControlValueAccessor implementation --

  writeValue(value: Date | null): void {
    this.selectedDate.set(value);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // -- Public API --

  openPicker(): void {
    if (this.disabled) return;
    this.isOpen.set(true);
    this.opened.emit();
  }

  closePicker(): void {
    this.isOpen.set(false);
    this.closed.emit();
  }

  togglePicker(): void {
    if (this.isOpen()) {
      this.closePicker();
    } else {
      this.openPicker();
    }
  }

  onDateSelected(date: Date): void {
    this.selectedDate.set(date);
    this.onChange(date);
    this.dateChange.emit(date);
    this.closePicker();
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) {
      this.selectedDate.set(null);
      this.onChange(null);
      this.dateChange.emit(null);
      return;
    }

    const parsed = new Date(value);
    if (!isNaN(parsed.getTime()) && this.isDateInRange(parsed)) {
      this.selectedDate.set(parsed);
      this.onChange(parsed);
      this.dateChange.emit(parsed);
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      this.closePicker();
      this.inputEl?.nativeElement.focus();
      event.preventDefault();
    }
  }

  // -- Private helpers --

  private isDateInRange(date: Date): boolean {
    if (this.minDate && date < this.minDate) return false;
    if (this.maxDate && date > this.maxDate) return false;
    return true;
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const year = date.getFullYear();

    return this.dateFormat
      .replace('yyyy', year.toString())
      .replace('MM', month)
      .replace('dd', day);
  }
}
