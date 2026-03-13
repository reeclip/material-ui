import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/** Represents a single day cell in the calendar grid. */
interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

type CalendarView = 'days' | 'months' | 'years';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * CalendarPanel — the popover calendar grid used by DesktopDatePicker.
 *
 * Supports day/month/year views, keyboard navigation, min/max constraints,
 * and configurable first day of week.
 */
@Component({
  selector: 'mui-calendar-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mui-calendar-panel" role="dialog" aria-label="Date picker" (keydown)="onKeydown($event)">
      <!-- Header -->
      <div class="mui-calendar-header">
        <button
          type="button"
          class="mui-calendar-nav-btn"
          (click)="navigatePrevious()"
          [attr.aria-label]="'Previous ' + (activeView() === 'days' ? 'month' : 'year range')"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        <button
          type="button"
          class="mui-calendar-header-label"
          (click)="cycleView()"
          [attr.aria-label]="'Switch to ' + nextViewLabel()"
        >
          <ng-container *ngIf="activeView() === 'days'">
            {{ monthName() }} {{ viewYear() }}
          </ng-container>
          <ng-container *ngIf="activeView() === 'months'">
            {{ viewYear() }}
          </ng-container>
          <ng-container *ngIf="activeView() === 'years'">
            {{ yearRangeStart() }} – {{ yearRangeStart() + 23 }}
          </ng-container>
        </button>

        <button
          type="button"
          class="mui-calendar-nav-btn"
          (click)="navigateNext()"
          [attr.aria-label]="'Next ' + (activeView() === 'days' ? 'month' : 'year range')"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
      </div>

      <!-- Day View -->
      <ng-container *ngIf="activeView() === 'days'">
        <div class="mui-calendar-weekdays" role="row">
          <span
            *ngFor="let d of weekdayLabels()"
            class="mui-calendar-weekday"
            role="columnheader"
            [attr.aria-label]="d"
          >
            {{ d }}
          </span>
        </div>

        <div class="mui-calendar-grid" role="grid">
          <button
            *ngFor="let day of calendarDays()"
            type="button"
            class="mui-calendar-day"
            [class.mui-other-month]="!day.isCurrentMonth"
            [class.mui-today]="day.isToday"
            [class.mui-selected]="day.isSelected"
            [class.mui-disabled]="day.isDisabled"
            [disabled]="day.isDisabled"
            [attr.aria-label]="day.date | date: 'fullDate'"
            [attr.aria-selected]="day.isSelected"
            [attr.aria-current]="day.isToday ? 'date' : null"
            role="gridcell"
            (click)="selectDate(day)"
          >
            {{ day.dayOfMonth }}
          </button>
        </div>
      </ng-container>

      <!-- Month View -->
      <ng-container *ngIf="activeView() === 'months'">
        <div class="mui-calendar-months-grid">
          <button
            *ngFor="let m of monthOptions(); let i = index"
            type="button"
            class="mui-calendar-month-cell"
            [class.mui-selected]="isMonthSelected(i)"
            [class.mui-current]="isCurrentMonth(i)"
            (click)="selectMonth(i)"
          >
            {{ m }}
          </button>
        </div>
      </ng-container>

      <!-- Year View -->
      <ng-container *ngIf="activeView() === 'years'">
        <div class="mui-calendar-years-grid">
          <button
            *ngFor="let y of yearOptions()"
            type="button"
            class="mui-calendar-year-cell"
            [class.mui-selected]="isYearSelected(y)"
            [class.mui-current]="isCurrentYear(y)"
            (click)="selectYear(y)"
          >
            {{ y }}
          </button>
        </div>
      </ng-container>

      <!-- Footer -->
      <div class="mui-calendar-footer">
        <button type="button" class="mui-calendar-today-btn" (click)="goToToday()">
          Today
        </button>
        <button type="button" class="mui-calendar-clear-btn" (click)="clearDate()">
          Clear
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .mui-calendar-panel {
        background: #fff;
        border-radius: 4px;
        box-shadow:
          0 5px 5px -3px rgba(0, 0, 0, 0.2),
          0 8px 10px 1px rgba(0, 0, 0, 0.14),
          0 3px 14px 2px rgba(0, 0, 0, 0.12);
        padding: 16px;
        min-width: 280px;
        outline: none;
        user-select: none;
      }

      /* Header */
      .mui-calendar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .mui-calendar-header-label {
        flex: 1;
        border: none;
        background: none;
        font-size: 14px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        text-align: center;
        font-family: inherit;
        transition: background-color 150ms;
      }

      .mui-calendar-header-label:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }

      .mui-calendar-nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        color: rgba(0, 0, 0, 0.54);
        padding: 0;
        transition: background-color 150ms;
      }

      .mui-calendar-nav-btn:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }

      .mui-calendar-nav-btn svg {
        fill: currentColor;
      }

      /* Weekday labels */
      .mui-calendar-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        margin-bottom: 4px;
      }

      .mui-calendar-weekday {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.38);
        font-weight: 500;
        height: 36px;
      }

      /* Day grid */
      .mui-calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }

      .mui-calendar-day {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        background: none;
        font-size: 13px;
        cursor: pointer;
        color: rgba(0, 0, 0, 0.87);
        padding: 0;
        margin: 0 auto;
        font-family: inherit;
        transition:
          background-color 150ms,
          color 150ms;
      }

      .mui-calendar-day:hover:not(.mui-selected):not(.mui-disabled) {
        background-color: rgba(0, 0, 0, 0.04);
      }

      .mui-calendar-day.mui-other-month {
        color: rgba(0, 0, 0, 0.38);
      }

      .mui-calendar-day.mui-today:not(.mui-selected) {
        border: 1px solid #1976d2;
      }

      .mui-calendar-day.mui-selected {
        background-color: #1976d2;
        color: #fff;
      }

      .mui-calendar-day.mui-selected:hover {
        background-color: #1565c0;
      }

      .mui-calendar-day.mui-disabled {
        color: rgba(0, 0, 0, 0.26);
        cursor: default;
      }

      /* Month grid */
      .mui-calendar-months-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        padding: 8px 0;
      }

      .mui-calendar-month-cell {
        border: none;
        background: none;
        padding: 12px 8px;
        border-radius: 20px;
        font-size: 13px;
        cursor: pointer;
        color: rgba(0, 0, 0, 0.87);
        font-family: inherit;
        transition: background-color 150ms;
      }

      .mui-calendar-month-cell:hover:not(.mui-selected) {
        background-color: rgba(0, 0, 0, 0.04);
      }

      .mui-calendar-month-cell.mui-selected {
        background-color: #1976d2;
        color: #fff;
      }

      .mui-calendar-month-cell.mui-current:not(.mui-selected) {
        border: 1px solid #1976d2;
      }

      /* Year grid */
      .mui-calendar-years-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
        padding: 8px 0;
        max-height: 280px;
        overflow-y: auto;
      }

      .mui-calendar-year-cell {
        border: none;
        background: none;
        padding: 8px 4px;
        border-radius: 20px;
        font-size: 13px;
        cursor: pointer;
        color: rgba(0, 0, 0, 0.87);
        font-family: inherit;
        transition: background-color 150ms;
      }

      .mui-calendar-year-cell:hover:not(.mui-selected) {
        background-color: rgba(0, 0, 0, 0.04);
      }

      .mui-calendar-year-cell.mui-selected {
        background-color: #1976d2;
        color: #fff;
      }

      .mui-calendar-year-cell.mui-current:not(.mui-selected) {
        border: 1px solid #1976d2;
      }

      /* Footer */
      .mui-calendar-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
      }

      .mui-calendar-today-btn,
      .mui-calendar-clear-btn {
        border: none;
        background: none;
        font-size: 13px;
        font-weight: 500;
        color: #1976d2;
        cursor: pointer;
        padding: 6px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: inherit;
        transition: background-color 150ms;
      }

      .mui-calendar-today-btn:hover,
      .mui-calendar-clear-btn:hover {
        background-color: rgba(25, 118, 210, 0.04);
      }
    `,
  ],
})
export class CalendarPanelComponent {
  /** Currently selected date */
  @Input()
  set value(v: Date | null) {
    this._value.set(v);
    if (v) {
      this.viewMonth.set(v.getMonth());
      this.viewYear.set(v.getFullYear());
    }
  }

  /** Minimum selectable date */
  @Input() minDate?: Date;

  /** Maximum selectable date */
  @Input() maxDate?: Date;

  /** First day of the week (0 = Sunday) */
  @Input() firstDayOfWeek = 0;

  /** Emitted when a date is selected */
  @Output() dateSelected = new EventEmitter<Date>();

  readonly _value = signal<Date | null>(null);
  readonly viewMonth = signal(new Date().getMonth());
  readonly viewYear = signal(new Date().getFullYear());
  readonly activeView = signal<CalendarView>('days');

  /** Start year for the 24-year range shown in year view */
  readonly yearRangeStart = computed(() => {
    const y = this.viewYear();
    return y - (y % 24);
  });

  /** Weekday header labels, rotated to start from firstDayOfWeek */
  readonly weekdayLabels = computed(() => {
    const labels = [...DAY_NAMES_SHORT];
    const offset = this.firstDayOfWeek;
    return [...labels.slice(offset), ...labels.slice(0, offset)];
  });

  /** Full month name for header display */
  readonly monthName = computed(() => MONTH_NAMES[this.viewMonth()]);

  /** 3-letter month labels for month view */
  readonly monthOptions = computed(() =>
    MONTH_NAMES.map((m) => m.substring(0, 3)),
  );

  /** Array of years for the year view */
  readonly yearOptions = computed(() => {
    const start = this.yearRangeStart();
    return Array.from({ length: 24 }, (_, i) => start + i);
  });

  /** Generates the 6×7 grid of CalendarDay objects */
  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const selected = this._value();
    const today = new Date();

    const firstOfMonth = new Date(year, month, 1);
    const firstDayIdx = (firstOfMonth.getDay() - this.firstDayOfWeek + 7) % 7;
    const startDate = new Date(year, month, 1 - firstDayIdx);

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate() + i,
      );
      days.push({
        date,
        dayOfMonth: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: this.isSameDay(date, today),
        isSelected: selected ? this.isSameDay(date, selected) : false,
        isDisabled: this.isDateDisabled(date),
      });
    }
    return days;
  });

  // -- View Navigation --

  cycleView(): void {
    const views: CalendarView[] = ['days', 'months', 'years'];
    const idx = views.indexOf(this.activeView());
    this.activeView.set(views[(idx + 1) % views.length]);
  }

  nextViewLabel(): string {
    const map: Record<CalendarView, string> = {
      days: 'month view',
      months: 'year view',
      years: 'day view',
    };
    return map[this.activeView()];
  }

  navigatePrevious(): void {
    switch (this.activeView()) {
      case 'days': {
        const m = this.viewMonth();
        if (m === 0) {
          this.viewMonth.set(11);
          this.viewYear.set(this.viewYear() - 1);
        } else {
          this.viewMonth.set(m - 1);
        }
        break;
      }
      case 'months':
        this.viewYear.set(this.viewYear() - 1);
        break;
      case 'years':
        this.viewYear.set(this.viewYear() - 24);
        break;
    }
  }

  navigateNext(): void {
    switch (this.activeView()) {
      case 'days': {
        const m = this.viewMonth();
        if (m === 11) {
          this.viewMonth.set(0);
          this.viewYear.set(this.viewYear() + 1);
        } else {
          this.viewMonth.set(m + 1);
        }
        break;
      }
      case 'months':
        this.viewYear.set(this.viewYear() + 1);
        break;
      case 'years':
        this.viewYear.set(this.viewYear() + 24);
        break;
    }
  }

  // -- Selection --

  selectDate(day: CalendarDay): void {
    if (day.isDisabled) return;
    this.dateSelected.emit(day.date);
  }

  selectMonth(monthIndex: number): void {
    this.viewMonth.set(monthIndex);
    this.activeView.set('days');
  }

  selectYear(year: number): void {
    this.viewYear.set(year);
    this.activeView.set('months');
  }

  goToToday(): void {
    const today = new Date();
    this.viewMonth.set(today.getMonth());
    this.viewYear.set(today.getFullYear());
    this.activeView.set('days');
    this.dateSelected.emit(today);
  }

  clearDate(): void {
    this._value.set(null);
    this.dateSelected.emit(undefined!);
  }

  // -- Helpers --

  isMonthSelected(monthIndex: number): boolean {
    const v = this._value();
    return !!v && v.getMonth() === monthIndex && v.getFullYear() === this.viewYear();
  }

  isCurrentMonth(monthIndex: number): boolean {
    const today = new Date();
    return today.getMonth() === monthIndex && today.getFullYear() === this.viewYear();
  }

  isYearSelected(year: number): boolean {
    const v = this._value();
    return !!v && v.getFullYear() === year;
  }

  isCurrentYear(year: number): boolean {
    return new Date().getFullYear() === year;
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.activeView() !== 'days') return;

    const selected = this._value() || new Date();
    let newDate: Date | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        newDate = this.addDays(selected, -1);
        break;
      case 'ArrowRight':
        newDate = this.addDays(selected, 1);
        break;
      case 'ArrowUp':
        newDate = this.addDays(selected, -7);
        break;
      case 'ArrowDown':
        newDate = this.addDays(selected, 7);
        break;
      case 'Enter':
      case ' ':
        this.dateSelected.emit(selected);
        event.preventDefault();
        return;
      default:
        return;
    }

    if (newDate && !this.isDateDisabled(newDate)) {
      this._value.set(newDate);
      this.viewMonth.set(newDate.getMonth());
      this.viewYear.set(newDate.getFullYear());
      event.preventDefault();
    }
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private isDateDisabled(date: Date): boolean {
    if (this.minDate && date < this.stripTime(this.minDate)) return true;
    if (this.maxDate && date > this.stripTime(this.maxDate)) return true;
    return false;
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
