import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

@Component({
  selector: 'mui-date-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="mui-date-picker">
      <div class="mui-date-picker__header">
        <button class="mui-date-picker__nav-btn" type="button" (click)="prevMonth()" aria-label="Previous month">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <button class="mui-date-picker__month-label" type="button" (click)="toggleYearView()">
          {{ monthYearLabel() }}
        </button>
        <button class="mui-date-picker__nav-btn" type="button" (click)="nextMonth()" aria-label="Next month">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
      </div>

      @if (!showYearView()) {
        <div class="mui-date-picker__weekdays">
          @for (day of weekdays; track day) {
            <div class="mui-date-picker__weekday">{{ day }}</div>
          }
        </div>

        <div class="mui-date-picker__days">
          @for (day of calendarDays(); track day.date.getTime()) {
            <button
              class="mui-date-picker__day"
              [class.mui-date-picker__day--outside]="!day.isCurrentMonth"
              [class.mui-date-picker__day--today]="day.isToday"
              [class.mui-date-picker__day--selected]="day.isSelected"
              [class.mui-date-picker__day--disabled]="day.isDisabled"
              [disabled]="day.isDisabled"
              type="button"
              (click)="selectDate(day)">
              {{ day.day }}
            </button>
          }
        </div>
      } @else {
        <div class="mui-date-picker__years">
          @for (year of yearRange(); track year) {
            <button
              class="mui-date-picker__year"
              [class.mui-date-picker__year--selected]="year === viewYear()"
              type="button"
              (click)="selectYear(year)">
              {{ year }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .mui-date-picker {
      padding: 0 8px 8px;
      width: 320px;
    }

    .mui-date-picker__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 4px;
    }

    .mui-date-picker__nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      border-radius: 50%;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.54);
      transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mui-date-picker__nav-btn:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .mui-date-picker__month-label {
      border: none;
      background: transparent;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      color: rgba(0, 0, 0, 0.87);
      transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mui-date-picker__month-label:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .mui-date-picker__weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
    }

    .mui-date-picker__weekday {
      font-size: 0.75rem;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.38);
      padding: 8px 0;
    }

    .mui-date-picker__days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }

    .mui-date-picker__day {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      margin: 0 auto;
      border: none;
      background: transparent;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.875rem;
      font-family: inherit;
      color: rgba(0, 0, 0, 0.87);
      transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mui-date-picker__day:hover:not(:disabled) {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .mui-date-picker__day--outside {
      color: rgba(0, 0, 0, 0.38);
    }

    .mui-date-picker__day--today {
      border: 1px solid #1976d2;
    }

    .mui-date-picker__day--selected {
      background-color: #1976d2 !important;
      color: white !important;
    }

    .mui-date-picker__day--disabled {
      color: rgba(0, 0, 0, 0.26);
      cursor: default;
    }

    .mui-date-picker__years {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
      max-height: 280px;
      overflow-y: auto;
      padding: 8px;
    }

    .mui-date-picker__year {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 16px;
      cursor: pointer;
      font-size: 0.875rem;
      font-family: inherit;
      padding: 8px;
      color: rgba(0, 0, 0, 0.87);
      transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mui-date-picker__year:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .mui-date-picker__year--selected {
      background-color: #1976d2 !important;
      color: white !important;
    }
  `],
})
export class DatePickerComponent {
  readonly selectedDate = input<Date | null>(null);
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);

  readonly dateSelected = output<Date>();

  readonly viewMonth = signal(new Date().getMonth());
  readonly viewYear = signal(new Date().getFullYear());
  readonly showYearView = signal(false);

  readonly weekdays = WEEKDAY_LABELS;

  readonly monthYearLabel = computed(() => {
    const date = new Date(this.viewYear(), this.viewMonth());
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  readonly yearRange = computed(() => {
    const current = this.viewYear();
    const years: number[] = [];
    for (let y = current - 50; y <= current + 50; y++) {
      years.push(y);
    }
    return years;
  });

  readonly calendarDays = computed((): CalendarDay[] => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const selected = this.selectedDate();
    const min = this.minDate();
    const max = this.maxDate();
    const today = new Date();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push(this.createDay(date, false, today, selected, min, max));
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push(this.createDay(date, true, today, selected, min, max));
    }

    // Next month days to complete the grid
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push(this.createDay(date, false, today, selected, min, max));
    }

    return days;
  });

  constructor() {
    // Initialize view from selected date if available
    const selected = this.selectedDate();
    if (selected) {
      this.viewMonth.set(selected.getMonth());
      this.viewYear.set(selected.getFullYear());
    }
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.update((m) => m - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.update((m) => m + 1);
    }
  }

  toggleYearView(): void {
    this.showYearView.update((v) => !v);
  }

  selectYear(year: number): void {
    this.viewYear.set(year);
    this.showYearView.set(false);
  }

  selectDate(day: CalendarDay): void {
    if (day.isDisabled) return;
    this.dateSelected.emit(day.date);
  }

  private createDay(
    date: Date,
    isCurrentMonth: boolean,
    today: Date,
    selected: Date | null,
    min: Date | null,
    max: Date | null,
  ): CalendarDay {
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isSelected = selected
      ? date.getDate() === selected.getDate() &&
        date.getMonth() === selected.getMonth() &&
        date.getFullYear() === selected.getFullYear()
      : false;

    const isDisabled =
      (min != null && date < new Date(min.getFullYear(), min.getMonth(), min.getDate())) ||
      (max != null && date > new Date(max.getFullYear(), max.getMonth(), max.getDate()));

    return { date, day: date.getDate(), isCurrentMonth, isToday, isSelected, isDisabled };
  }
}
