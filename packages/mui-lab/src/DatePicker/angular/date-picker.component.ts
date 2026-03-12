import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Renderer2,
  Inject,
  forwardRef,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';
import {
  buildCalendarGrid,
  buildYearList,
  formatDate,
  parseDate,
  isSameDay,
  WEEK_DAYS,
  MONTH_NAMES,
  MONTH_NAMES_SHORT,
  CalendarDay,
  CalendarWeek,
} from './date-utils';

export type DatePickerView = 'day' | 'month' | 'year';

/**
 * MuiDatePicker — Angular port of Material UI's DatePicker.
 *
 * Standalone component using modern Angular practices:
 * - Signals for reactive state
 * - Built-in control flow (@if, @for, @switch)
 * - ControlValueAccessor for forms integration
 * - OnPush change detection
 *
 * Usage:
 * ```html
 * <mui-date-picker [(value)]="selectedDate" label="Pick a date" />
 *
 * <!-- With Reactive Forms -->
 * <mui-date-picker formControlName="birthDate" label="Birth date" />
 *
 * <!-- Static (always visible calendar) -->
 * <mui-date-picker [(value)]="date" [static]="true" />
 * ```
 */
@Component({
  selector: 'mui-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MuiDatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <!-- Input field (hidden in static mode) -->
    @if (!static) {
      <div class="MuiDatePicker-inputContainer" #inputContainer>
        <label
          *ngIf="label"
          class="MuiDatePicker-label"
          [class.MuiDatePicker-labelFocused]="isOpen()"
          [class.MuiDatePicker-labelFilled]="inputValue()"
          (click)="focusInput()"
        >{{ label }}</label>
        <div class="MuiDatePicker-inputWrapper" (click)="togglePicker()">
          <input
            #dateInput
            class="MuiDatePicker-input"
            type="text"
            [value]="inputValue()"
            [disabled]="disabled"
            [readOnly]="readOnly"
            [placeholder]="placeholder"
            [attr.aria-label]="label || 'Choose date'"
            (input)="onInputChange($event)"
            (keydown)="onInputKeydown($event)"
            (blur)="onInputBlur()"
          />
          <button
            class="MuiDatePicker-calendarButton"
            type="button"
            [disabled]="disabled"
            (click)="togglePicker(); $event.stopPropagation()"
            aria-label="Open calendar"
          >
            <svg class="MuiDatePicker-calendarIcon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
            </svg>
          </button>
        </div>
      </div>
    }

    <!-- Calendar popover / static calendar -->
    @if (isOpen() || static) {
      <div
        class="MuiDatePicker-popover"
        [class.MuiDatePicker-popoverStatic]="static"
        #popover
        role="dialog"
        aria-modal="true"
        aria-label="Date picker"
      >
        <div class="MuiDatePicker-paper">
          <!-- Calendar Header -->
          <div class="MuiPickersCalendarHeader-root">
            <button
              class="MuiPickersCalendarHeader-switchViewButton"
              type="button"
              (click)="cycleView()"
              [attr.aria-label]="'Switch to ' + nextViewLabel()"
            >
              <span class="MuiPickersCalendarHeader-label">
                {{ currentMonthName() }} {{ viewYear() }}
              </span>
              <svg class="MuiPickersCalendarHeader-switchViewIcon" viewBox="0 0 24 24" fill="currentColor"
                   [class.MuiPickersCalendarHeader-switchViewIconOpen]="currentView() !== 'day'">
                <path d="M7.41 8.59L12 13.17l4.58-4.58L18 10l-6 6-6-6z"/>
              </svg>
            </button>
            <div class="MuiPickersArrowSwitcher-root">
              <button
                class="MuiPickersArrowSwitcher-button"
                type="button"
                (click)="navigatePrev()"
                aria-label="Previous month"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              </button>
              <div class="MuiPickersArrowSwitcher-spacer"></div>
              <button
                class="MuiPickersArrowSwitcher-button"
                type="button"
                (click)="navigateNext()"
                aria-label="Next month"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
              </button>
            </div>
          </div>

          <!-- Day View -->
          @if (currentView() === 'day') {
            <div class="MuiDateCalendar-root" role="grid" aria-label="Calendar">
              <div class="MuiDateCalendar-weekDayLabels" role="row">
                @for (day of weekDays; track day) {
                  <span class="MuiDateCalendar-weekDayLabel" role="columnheader" [attr.aria-label]="day">{{ day }}</span>
                }
              </div>
              <div class="MuiPickersSlideTransition-root">
                @for (week of calendarGrid(); track $index) {
                  <div class="MuiDateCalendar-weekRow" role="row">
                    @for (cell of week.days; track cell.date.getTime()) {
                      <button
                        class="MuiPickersDay-root"
                        type="button"
                        role="gridcell"
                        [class.MuiPickersDay-today]="cell.isToday"
                        [class.MuiPickersDay-selected]="cell.isSelected"
                        [class.MuiPickersDay-outsideMonth]="!cell.isCurrentMonth"
                        [class.MuiPickersDay-disabled]="cell.isDisabled"
                        [disabled]="cell.isDisabled"
                        [attr.aria-selected]="cell.isSelected"
                        [attr.aria-label]="cell.date.toDateString()"
                        [tabindex]="cell.isSelected ? 0 : -1"
                        (click)="selectDay(cell)"
                      >{{ cell.day }}</button>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Month View -->
          @if (currentView() === 'month') {
            <div class="MuiMonthCalendar-root" role="listbox" aria-label="Month selection">
              @for (monthName of monthNamesShort; track $index) {
                <button
                  class="MuiMonthCalendar-button"
                  type="button"
                  role="option"
                  [class.MuiMonthCalendar-selected]="$index === viewMonth()"
                  [attr.aria-selected]="$index === viewMonth()"
                  (click)="selectMonth($index)"
                >{{ monthName }}</button>
              }
            </div>
          }

          <!-- Year View -->
          @if (currentView() === 'year') {
            <div class="MuiYearCalendar-root" role="listbox" aria-label="Year selection" #yearList>
              @for (yr of yearList(); track yr) {
                <button
                  class="MuiYearCalendar-button"
                  type="button"
                  role="option"
                  [class.MuiYearCalendar-selected]="yr === viewYear()"
                  [attr.aria-selected]="yr === viewYear()"
                  [attr.data-year]="yr"
                  (click)="selectYear(yr)"
                >{{ yr }}</button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: inline-block;
      position: relative;
      font-family: "Roboto", "Helvetica", "Arial", sans-serif;
    }

    /* ---- Input ---- */
    .MuiDatePicker-inputContainer {
      position: relative;
    }
    .MuiDatePicker-label {
      position: absolute;
      top: 0;
      left: 14px;
      transform: translateY(16px);
      font-size: 1rem;
      color: rgba(0, 0, 0, 0.6);
      pointer-events: none;
      transition: transform 200ms cubic-bezier(0, 0, 0.2, 1),
                  font-size 200ms cubic-bezier(0, 0, 0.2, 1),
                  color 200ms cubic-bezier(0, 0, 0.2, 1);
      cursor: text;
    }
    .MuiDatePicker-labelFocused,
    .MuiDatePicker-labelFilled {
      transform: translateY(-9px);
      font-size: 0.75rem;
      background: #fff;
      padding: 0 4px;
    }
    .MuiDatePicker-labelFocused {
      color: #1976d2;
    }
    .MuiDatePicker-inputWrapper {
      display: flex;
      align-items: center;
      border: 1px solid rgba(0, 0, 0, 0.23);
      border-radius: 4px;
      padding: 8px 14px;
      cursor: text;
      transition: border-color 200ms;
    }
    .MuiDatePicker-inputWrapper:hover {
      border-color: rgba(0, 0, 0, 0.87);
    }
    .MuiDatePicker-inputWrapper:focus-within {
      border-color: #1976d2;
      border-width: 2px;
      padding: 7px 13px;
    }
    .MuiDatePicker-input {
      border: none;
      outline: none;
      font: inherit;
      font-size: 1rem;
      background: transparent;
      flex: 1;
      min-width: 0;
      padding: 8px 0;
    }
    .MuiDatePicker-calendarButton {
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 8px;
      margin: -8px -8px -8px 0;
      border-radius: 50%;
      color: rgba(0, 0, 0, 0.54);
      transition: background-color 150ms;
    }
    .MuiDatePicker-calendarButton:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    .MuiDatePicker-calendarButton:disabled {
      color: rgba(0, 0, 0, 0.26);
      cursor: default;
    }
    .MuiDatePicker-calendarIcon {
      width: 24px;
      height: 24px;
    }

    /* ---- Popover ---- */
    .MuiDatePicker-popover {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 1300;
      margin-top: 4px;
    }
    .MuiDatePicker-popoverStatic {
      position: static;
      margin-top: 0;
    }
    .MuiDatePicker-paper {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),
                  0px 8px 10px 1px rgba(0,0,0,0.14),
                  0px 3px 14px 2px rgba(0,0,0,0.12);
      overflow: hidden;
      min-width: 320px;
    }
    .MuiDatePicker-popoverStatic .MuiDatePicker-paper {
      box-shadow: none;
      border: 1px solid rgba(0, 0, 0, 0.12);
    }

    /* ---- Calendar Header ---- */
    .MuiPickersCalendarHeader-root {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 8px;
    }
    .MuiPickersCalendarHeader-switchViewButton {
      display: flex;
      align-items: center;
      gap: 4px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      font-family: inherit;
      color: rgba(0, 0, 0, 0.87);
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 150ms;
    }
    .MuiPickersCalendarHeader-switchViewButton:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    .MuiPickersCalendarHeader-label {
      pointer-events: none;
    }
    .MuiPickersCalendarHeader-switchViewIcon {
      width: 20px;
      height: 20px;
      transition: transform 200ms;
    }
    .MuiPickersCalendarHeader-switchViewIconOpen {
      transform: rotate(180deg);
    }
    .MuiPickersArrowSwitcher-root {
      display: flex;
      align-items: center;
    }
    .MuiPickersArrowSwitcher-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 50%;
      color: rgba(0, 0, 0, 0.54);
      transition: background-color 150ms;
    }
    .MuiPickersArrowSwitcher-button:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    .MuiPickersArrowSwitcher-button svg {
      width: 20px;
      height: 20px;
    }
    .MuiPickersArrowSwitcher-spacer {
      width: 8px;
    }

    /* ---- Day Calendar ---- */
    .MuiDateCalendar-root {
      padding: 0 16px 16px;
    }
    .MuiDateCalendar-weekDayLabels {
      display: flex;
      justify-content: space-around;
      margin-bottom: 8px;
    }
    .MuiDateCalendar-weekDayLabel {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.38);
    }
    .MuiDateCalendar-weekRow {
      display: flex;
      justify-content: space-around;
    }
    .MuiPickersDay-root {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.87);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 150ms;
    }
    .MuiPickersDay-root:hover:not(:disabled) {
      background-color: rgba(0, 0, 0, 0.04);
    }
    .MuiPickersDay-today {
      border: 1px solid #1976d2;
    }
    .MuiPickersDay-selected {
      background-color: #1976d2 !important;
      color: #fff;
      font-weight: 500;
    }
    .MuiPickersDay-outsideMonth {
      color: rgba(0, 0, 0, 0.38);
    }
    .MuiPickersDay-disabled {
      color: rgba(0, 0, 0, 0.26);
      cursor: default;
    }

    /* ---- Month Calendar ---- */
    .MuiMonthCalendar-root {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 8px 16px 16px;
    }
    .MuiMonthCalendar-button {
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.87);
      padding: 8px;
      border-radius: 20px;
      transition: background-color 150ms;
    }
    .MuiMonthCalendar-button:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    .MuiMonthCalendar-selected {
      background-color: #1976d2 !important;
      color: #fff;
      font-weight: 500;
    }

    /* ---- Year Calendar ---- */
    .MuiYearCalendar-root {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      padding: 8px 16px 16px;
      max-height: 280px;
      overflow-y: auto;
    }
    .MuiYearCalendar-button {
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.87);
      padding: 8px 4px;
      border-radius: 20px;
      transition: background-color 150ms;
    }
    .MuiYearCalendar-button:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    .MuiYearCalendar-selected {
      background-color: #1976d2 !important;
      color: #fff;
      font-weight: 500;
    }
  `],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closePicker()',
  },
})
export class MuiDatePickerComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {
  /** The currently selected date. */
  @Input() value: Date | null = null;

  /** Emits when the selected date changes. Supports two-way binding via [(value)]. */
  @Output() valueChange = new EventEmitter<Date | null>();

  /** Label text displayed above the input. */
  @Input() label = '';

  /** Placeholder text for the input. */
  @Input() placeholder = 'MM/DD/YYYY';

  /** Whether the picker is disabled. */
  @Input() disabled = false;

  /** Whether the input is read-only (calendar still opens). */
  @Input() readOnly = false;

  /** Minimum selectable date. */
  @Input() minDate: Date | null = null;

  /** Maximum selectable date. */
  @Input() maxDate: Date | null = null;

  /** Show as a static calendar without input field. */
  @Input() static = false;

  /** Initial view when the picker opens. */
  @Input() openTo: DatePickerView = 'day';

  /** Emits when the picker opens. */
  @Output() opened = new EventEmitter<void>();

  /** Emits when the picker closes. */
  @Output() closed = new EventEmitter<void>();

  @ViewChild('dateInput') dateInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('popover') popoverRef!: ElementRef<HTMLDivElement>;
  @ViewChild('inputContainer') inputContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('yearList') yearListRef!: ElementRef<HTMLDivElement>;

  readonly weekDays = WEEK_DAYS;
  readonly monthNamesShort = MONTH_NAMES_SHORT;

  // Signals for reactive state
  readonly isOpen = signal(false);
  readonly currentView = signal<DatePickerView>('day');
  readonly viewYear = signal(new Date().getFullYear());
  readonly viewMonth = signal(new Date().getMonth());
  readonly selectedDate = signal<Date | null>(null);

  readonly inputValue = computed(() => formatDate(this.selectedDate()));

  readonly currentMonthName = computed(() => MONTH_NAMES[this.viewMonth()]);

  readonly calendarGrid = computed(() =>
    buildCalendarGrid(
      this.viewYear(),
      this.viewMonth(),
      this.selectedDate(),
      this.minDate,
      this.maxDate,
    ),
  );

  readonly yearList = computed(() => buildYearList(this.viewYear()));

  // ControlValueAccessor callbacks
  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  private scrollYearEffect = effect(() => {
    // When year view opens, scroll to selected year
    const view = this.currentView();
    if (view === 'year') {
      setTimeout(() => this.scrollToSelectedYear());
    }
  });

  constructor(
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    if (this.static) {
      this.isOpen.set(true);
    }
    this.currentView.set(this.openTo);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.selectedDate.set(this.value);
      if (this.value) {
        this.viewYear.set(this.value.getFullYear());
        this.viewMonth.set(this.value.getMonth());
      }
    }
    if (changes['openTo']) {
      this.currentView.set(this.openTo);
    }
  }

  ngOnDestroy(): void {}

  // --- ControlValueAccessor ---

  writeValue(value: Date | null): void {
    this.selectedDate.set(value);
    if (value) {
      this.viewYear.set(value.getFullYear());
      this.viewMonth.set(value.getMonth());
    }
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

  // --- Public API ---

  togglePicker(): void {
    if (this.disabled) return;
    this.isOpen() ? this.closePicker() : this.openPicker();
  }

  openPicker(): void {
    if (this.disabled || this.isOpen()) return;
    this.isOpen.set(true);
    this.currentView.set(this.openTo);
    this.opened.emit();
  }

  closePicker(): void {
    if (!this.isOpen() || this.static) return;
    this.isOpen.set(false);
    this.closed.emit();
    this.onTouched();
  }

  // --- Navigation ---

  navigatePrev(): void {
    const view = this.currentView();
    if (view === 'day') {
      if (this.viewMonth() === 0) {
        this.viewMonth.set(11);
        this.viewYear.update((y) => y - 1);
      } else {
        this.viewMonth.update((m) => m - 1);
      }
    } else if (view === 'year') {
      this.viewYear.update((y) => y - 10);
    }
  }

  navigateNext(): void {
    const view = this.currentView();
    if (view === 'day') {
      if (this.viewMonth() === 11) {
        this.viewMonth.set(0);
        this.viewYear.update((y) => y + 1);
      } else {
        this.viewMonth.update((m) => m + 1);
      }
    } else if (view === 'year') {
      this.viewYear.update((y) => y + 10);
    }
  }

  cycleView(): void {
    const order: DatePickerView[] = ['day', 'month', 'year'];
    const current = this.currentView();
    if (current === 'day') {
      this.currentView.set('year');
    } else {
      this.currentView.set('day');
    }
  }

  nextViewLabel(): string {
    return this.currentView() === 'day' ? 'year view' : 'day view';
  }

  // --- Selection ---

  selectDay(cell: CalendarDay): void {
    if (cell.isDisabled) return;
    this.setDate(cell.date);
    if (!this.static) {
      this.closePicker();
    }
  }

  selectMonth(month: number): void {
    this.viewMonth.set(month);
    this.currentView.set('day');
  }

  selectYear(year: number): void {
    this.viewYear.set(year);
    this.currentView.set('month');
  }

  // --- Input handling ---

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const parsed = parseDate(value);
    if (parsed) {
      this.setDate(parsed);
    }
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.openPicker();
    }
  }

  onInputBlur(): void {
    this.onTouched();
  }

  focusInput(): void {
    this.dateInputRef?.nativeElement?.focus();
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.static || !this.isOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closePicker();
    }
  }

  // --- Internal ---

  private setDate(date: Date): void {
    this.selectedDate.set(date);
    this.viewYear.set(date.getFullYear());
    this.viewMonth.set(date.getMonth());
    this.valueChange.emit(date);
    this.onChange(date);
  }

  private scrollToSelectedYear(): void {
    if (!this.yearListRef) return;
    const container = this.yearListRef.nativeElement;
    const selected = container.querySelector('.MuiYearCalendar-selected') as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: 'center' });
    }
  }
}
