import {
  Component,
  input,
  output,
  signal,
  computed,
  forwardRef,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  ElementRef,
  viewChild,
  effect,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { DatePickerComponent } from './date-picker.component';
import { TimePickerComponent } from './time-picker.component';

export type DateTimePickerView = 'date' | 'time';

export interface DateTimePickerProps {
  /** The minimum selectable date */
  minDate?: Date;
  /** The maximum selectable date */
  maxDate?: Date;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Whether the picker is read-only */
  readOnly?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Label text for the input */
  label?: string;
  /** Format string for displaying the date-time value */
  format?: string;
  /** Whether to show the toolbar with view toggle */
  showToolbar?: boolean;
  /** Whether to use 24-hour format for time */
  use24HourFormat?: boolean;
  /** The initial view to display */
  initialView?: DateTimePickerView;
  /** Whether to auto-close after selection */
  autoClose?: boolean;
  /** CSS class to apply to the host element */
  hostClass?: string;
}

@Component({
  selector: 'mui-date-time-picker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent, TimePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="mui-date-time-picker" [class.mui-date-time-picker--disabled]="disabled()" [class.mui-date-time-picker--open]="isOpen()">
      <div class="mui-date-time-picker__input-wrapper" (click)="openPicker()">
        <label class="mui-date-time-picker__label"
               [class.mui-date-time-picker__label--floating]="isOpen() || !!value()"
               [class.mui-date-time-picker__label--focused]="isOpen()">
          {{ label() }}
        </label>
        <input
          #inputRef
          class="mui-date-time-picker__input"
          type="text"
          [value]="displayValue()"
          [placeholder]="isOpen() || !label() ? placeholder() : ''"
          [disabled]="disabled()"
          [readOnly]="true"
          (focus)="openPicker()"
          (blur)="onInputBlur()"
        />
        <button
          class="mui-date-time-picker__toggle-btn"
          type="button"
          [disabled]="disabled()"
          (click)="togglePicker($event)"
          aria-label="Open date time picker">
          <svg class="mui-date-time-picker__icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
          </svg>
        </button>
      </div>

      @if (isOpen()) {
        <div class="mui-date-time-picker__popover" role="dialog" aria-modal="true" aria-label="Date time picker">
          @if (showToolbar()) {
            <div class="mui-date-time-picker__toolbar">
              <button
                class="mui-date-time-picker__toolbar-btn"
                [class.mui-date-time-picker__toolbar-btn--active]="activeView() === 'date'"
                type="button"
                (click)="setView('date')">
                {{ toolbarDateText() }}
              </button>
              <button
                class="mui-date-time-picker__toolbar-btn"
                [class.mui-date-time-picker__toolbar-btn--active]="activeView() === 'time'"
                type="button"
                (click)="setView('time')">
                {{ toolbarTimeText() }}
              </button>
            </div>
          }

          <div class="mui-date-time-picker__content">
            @if (activeView() === 'date') {
              <mui-date-picker
                [selectedDate]="value()"
                [minDate]="minDate()"
                [maxDate]="maxDate()"
                (dateSelected)="onDateSelected($event)">
              </mui-date-picker>
            } @else {
              <mui-time-picker
                [selectedTime]="value()"
                [use24Hour]="use24HourFormat()"
                (timeSelected)="onTimeSelected($event)">
              </mui-time-picker>
            }
          </div>

          <div class="mui-date-time-picker__actions">
            <button class="mui-date-time-picker__action-btn" type="button" (click)="onCancel()">
              Cancel
            </button>
            <button class="mui-date-time-picker__action-btn mui-date-time-picker__action-btn--primary" type="button" (click)="onAccept()">
              OK
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .mui-date-time-picker {
      position: relative;
      display: inline-flex;
      flex-direction: column;
      font-family: Roboto, "Helvetica Neue", Arial, sans-serif;
      min-width: 256px;
    }

    .mui-date-time-picker__input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      border: 1px solid rgba(0, 0, 0, 0.23);
      border-radius: 4px;
      padding: 16.5px 14px;
      cursor: pointer;
      transition: border-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mui-date-time-picker__input-wrapper:hover {
      border-color: rgba(0, 0, 0, 0.87);
    }

    .mui-date-time-picker--open .mui-date-time-picker__input-wrapper {
      border-color: #1976d2;
      border-width: 2px;
      padding: 15.5px 13px;
    }

    .mui-date-time-picker--disabled .mui-date-time-picker__input-wrapper {
      border-color: rgba(0, 0, 0, 0.12);
      cursor: default;
      pointer-events: none;
    }

    .mui-date-time-picker__label {
      position: absolute;
      top: 50%;
      left: 14px;
      transform: translateY(-50%);
      color: rgba(0, 0, 0, 0.6);
      font-size: 1rem;
      pointer-events: none;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      background: white;
      padding: 0;
    }

    .mui-date-time-picker__label--floating {
      top: 0;
      transform: translateY(-50%) scale(0.75);
      padding: 0 4px;
      font-size: 1rem;
    }

    .mui-date-time-picker__label--focused {
      color: #1976d2;
    }

    .mui-date-time-picker__input {
      border: none;
      outline: none;
      font-size: 1rem;
      font-family: inherit;
      flex: 1;
      padding: 0;
      background: transparent;
      color: rgba(0, 0, 0, 0.87);
      cursor: pointer;
    }

    .mui-date-time-picker__input:disabled {
      color: rgba(0, 0, 0, 0.38);
      cursor: default;
    }

    .mui-date-time-picker__toggle-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      color: rgba(0, 0, 0, 0.54);
      margin: -4px -4px -4px 8px;
      transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mui-date-time-picker__toggle-btn:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .mui-date-time-picker__toggle-btn:disabled {
      color: rgba(0, 0, 0, 0.26);
      cursor: default;
    }

    .mui-date-time-picker__icon {
      display: block;
    }

    .mui-date-time-picker__popover {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 1300;
      margin-top: 4px;
      background: white;
      border-radius: 4px;
      box-shadow:
        0 5px 5px -3px rgba(0, 0, 0, 0.2),
        0 8px 10px 1px rgba(0, 0, 0, 0.14),
        0 3px 14px 2px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      min-width: 320px;
    }

    .mui-date-time-picker__toolbar {
      display: flex;
      background-color: #1976d2;
      padding: 16px 24px;
      gap: 16px;
    }

    .mui-date-time-picker__toolbar-btn {
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.54);
      font-size: 1rem;
      font-family: inherit;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: color 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mui-date-time-picker__toolbar-btn:hover {
      color: rgba(255, 255, 255, 0.8);
    }

    .mui-date-time-picker__toolbar-btn--active {
      color: white;
    }

    .mui-date-time-picker__content {
      padding: 0;
    }

    .mui-date-time-picker__actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px;
      gap: 8px;
    }

    .mui-date-time-picker__action-btn {
      border: none;
      background: transparent;
      color: #1976d2;
      font-size: 0.875rem;
      font-family: inherit;
      font-weight: 500;
      text-transform: uppercase;
      cursor: pointer;
      padding: 6px 16px;
      border-radius: 4px;
      letter-spacing: 0.02857em;
      line-height: 1.75;
      min-width: 64px;
      transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mui-date-time-picker__action-btn:hover {
      background-color: rgba(25, 118, 210, 0.04);
    }

    .mui-date-time-picker__action-btn--primary {
      background-color: #1976d2;
      color: white;
    }

    .mui-date-time-picker__action-btn--primary:hover {
      background-color: #1565c0;
    }
  `],
})
export class DateTimePickerComponent implements ControlValueAccessor, OnDestroy {
  // Inputs
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readOnly = input<boolean>(false);
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly format = input<string>('MM/dd/yyyy hh:mm a');
  readonly showToolbar = input<boolean>(true);
  readonly use24HourFormat = input<boolean>(false);
  readonly initialView = input<DateTimePickerView>('date');
  readonly autoClose = input<boolean>(false);

  // Outputs
  readonly dateTimeChange = output<Date | null>();
  readonly opened = output<void>();
  readonly closed = output<void>();

  // Internal state
  readonly value = signal<Date | null>(null);
  readonly isOpen = signal(false);
  readonly activeView = signal<DateTimePickerView>('date');
  private pendingValue = signal<Date | null>(null);

  readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('inputRef');

  // ControlValueAccessor callbacks
  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  // Computed values
  readonly displayValue = computed(() => {
    const val = this.value();
    if (!val) return '';
    return this.formatDateTime(val);
  });

  readonly toolbarDateText = computed(() => {
    const val = this.pendingValue() ?? this.value();
    if (!val) return 'Select date';
    return val.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  });

  readonly toolbarTimeText = computed(() => {
    const val = this.pendingValue() ?? this.value();
    if (!val) return 'Select time';
    return val.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !this.use24HourFormat(),
    });
  });

  private clickOutsideHandler = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.mui-date-time-picker')) {
      this.closePicker();
    }
  };

  constructor() {
    effect(() => {
      this.activeView.set(this.initialView());
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.clickOutsideHandler);
  }

  // ControlValueAccessor implementation
  writeValue(value: Date | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Disabled is handled via the input signal
  }

  // Public methods
  openPicker(): void {
    if (this.disabled() || this.readOnly()) return;
    if (this.isOpen()) return;

    this.isOpen.set(true);
    this.pendingValue.set(this.value() ? new Date(this.value()!.getTime()) : null);
    this.opened.emit();
    document.addEventListener('click', this.clickOutsideHandler);
  }

  closePicker(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.pendingValue.set(null);
    this.onTouched();
    this.closed.emit();
    document.removeEventListener('click', this.clickOutsideHandler);
  }

  togglePicker(event: Event): void {
    event.stopPropagation();
    if (this.isOpen()) {
      this.closePicker();
    } else {
      this.openPicker();
    }
  }

  setView(view: DateTimePickerView): void {
    this.activeView.set(view);
  }

  onDateSelected(date: Date): void {
    const current = this.pendingValue() ?? new Date();
    const merged = new Date(date);
    merged.setHours(current.getHours(), current.getMinutes(), current.getSeconds());
    this.pendingValue.set(merged);

    if (this.autoClose()) {
      this.acceptValue(merged);
    } else {
      // Auto-advance to time view after date selection
      this.activeView.set('time');
    }
  }

  onTimeSelected(date: Date): void {
    const current = this.pendingValue() ?? new Date();
    const merged = new Date(current);
    merged.setHours(date.getHours(), date.getMinutes(), date.getSeconds());
    this.pendingValue.set(merged);

    if (this.autoClose()) {
      this.acceptValue(merged);
    }
  }

  onCancel(): void {
    this.closePicker();
  }

  onAccept(): void {
    const pending = this.pendingValue();
    if (pending) {
      this.acceptValue(pending);
    }
    this.closePicker();
  }

  onInputBlur(): void {
    // Delay to allow popover clicks to register
    setTimeout(() => {
      if (!this.isOpen()) {
        this.onTouched();
      }
    }, 200);
  }

  private acceptValue(date: Date): void {
    this.value.set(date);
    this.onChange(date);
    this.dateTimeChange.emit(date);
  }

  private formatDateTime(date: Date): string {
    const fmt = this.format();
    const pad = (n: number) => n.toString().padStart(2, '0');

    const hours24 = date.getHours();
    const hours12 = hours24 % 12 || 12;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';

    return fmt
      .replace('yyyy', date.getFullYear().toString())
      .replace('MM', pad(date.getMonth() + 1))
      .replace('dd', pad(date.getDate()))
      .replace('HH', pad(hours24))
      .replace('hh', pad(hours12))
      .replace('mm', pad(date.getMinutes()))
      .replace('ss', pad(date.getSeconds()))
      .replace('a', ampm);
  }
}
