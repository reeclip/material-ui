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

type TimePeriod = 'AM' | 'PM';
type TimeView = 'hours' | 'minutes';

@Component({
  selector: 'mui-time-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="mui-time-picker">
      <div class="mui-time-picker__display">
        <button
          class="mui-time-picker__display-segment"
          [class.mui-time-picker__display-segment--active]="timeView() === 'hours'"
          type="button"
          (click)="setTimeView('hours')">
          {{ displayHours() }}
        </button>
        <span class="mui-time-picker__display-separator">:</span>
        <button
          class="mui-time-picker__display-segment"
          [class.mui-time-picker__display-segment--active]="timeView() === 'minutes'"
          type="button"
          (click)="setTimeView('minutes')">
          {{ displayMinutes() }}
        </button>
        @if (!use24Hour()) {
          <div class="mui-time-picker__period-toggle">
            <button
              class="mui-time-picker__period-btn"
              [class.mui-time-picker__period-btn--active]="period() === 'AM'"
              type="button"
              (click)="setPeriod('AM')">
              AM
            </button>
            <button
              class="mui-time-picker__period-btn"
              [class.mui-time-picker__period-btn--active]="period() === 'PM'"
              type="button"
              (click)="setPeriod('PM')">
              PM
            </button>
          </div>
        }
      </div>

      <div class="mui-time-picker__clock">
        <div class="mui-time-picker__clock-face">
          <div class="mui-time-picker__clock-center"></div>
          @if (selectedAngle() !== null) {
            <div
              class="mui-time-picker__clock-hand"
              [style.transform]="'rotate(' + selectedAngle() + 'deg)'">
              <div class="mui-time-picker__clock-hand-tip"></div>
            </div>
          }
          @for (item of clockValues(); track item.value) {
            <button
              class="mui-time-picker__clock-number"
              [class.mui-time-picker__clock-number--selected]="item.isSelected"
              [class.mui-time-picker__clock-number--inner]="item.isInner"
              [style.transform]="getClockNumberTransform(item.angle, item.isInner)"
              type="button"
              (click)="selectClockValue(item.value)">
              {{ item.display }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mui-time-picker {
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 288px;
    }

    .mui-time-picker__display {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      gap: 2px;
    }

    .mui-time-picker__display-segment {
      border: none;
      background-color: rgba(0, 0, 0, 0.08);
      border-radius: 4px;
      font-size: 3rem;
      font-family: inherit;
      font-weight: 400;
      padding: 4px 12px;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.87);
      min-width: 80px;
      text-align: center;
      transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mui-time-picker__display-segment--active {
      background-color: rgba(25, 118, 210, 0.12);
      color: #1976d2;
    }

    .mui-time-picker__display-separator {
      font-size: 3rem;
      color: rgba(0, 0, 0, 0.87);
      margin: 0 4px;
    }

    .mui-time-picker__period-toggle {
      display: flex;
      flex-direction: column;
      margin-left: 12px;
      border: 1px solid rgba(0, 0, 0, 0.23);
      border-radius: 4px;
      overflow: hidden;
    }

    .mui-time-picker__period-btn {
      border: none;
      background: transparent;
      font-size: 0.75rem;
      font-weight: 500;
      font-family: inherit;
      padding: 4px 8px;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.54);
      transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mui-time-picker__period-btn:first-child {
      border-bottom: 1px solid rgba(0, 0, 0, 0.23);
    }

    .mui-time-picker__period-btn--active {
      background-color: rgba(25, 118, 210, 0.12);
      color: #1976d2;
    }

    .mui-time-picker__clock {
      position: relative;
      width: 256px;
      height: 256px;
      margin: 8px 0;
    }

    .mui-time-picker__clock-face {
      position: relative;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.07);
      border-radius: 50%;
    }

    .mui-time-picker__clock-center {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 6px;
      height: 6px;
      background-color: #1976d2;
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }

    .mui-time-picker__clock-hand {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 2px;
      height: 40%;
      background-color: #1976d2;
      transform-origin: bottom center;
      margin-left: -1px;
      margin-top: -40%;
      transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mui-time-picker__clock-hand-tip {
      position: absolute;
      top: 0;
      left: 50%;
      width: 36px;
      height: 36px;
      background-color: #1976d2;
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }

    .mui-time-picker__clock-number {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 36px;
      height: 36px;
      margin: -18px 0 0 -18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.875rem;
      font-family: inherit;
      color: rgba(0, 0, 0, 0.87);
      z-index: 1;
      transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mui-time-picker__clock-number:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .mui-time-picker__clock-number--selected {
      color: white !important;
    }

    .mui-time-picker__clock-number--inner {
      font-size: 0.75rem;
    }
  `],
})
export class TimePickerComponent {
  readonly selectedTime = input<Date | null>(null);
  readonly use24Hour = input<boolean>(false);

  readonly timeSelected = output<Date>();

  readonly hours = signal(0);
  readonly minutes = signal(0);
  readonly period = signal<TimePeriod>('AM');
  readonly timeView = signal<TimeView>('hours');

  readonly displayHours = computed(() => {
    const h = this.hours();
    if (this.use24Hour()) {
      return h.toString().padStart(2, '0');
    }
    const h12 = h % 12 || 12;
    return h12.toString().padStart(2, '0');
  });

  readonly displayMinutes = computed(() => {
    return this.minutes().toString().padStart(2, '0');
  });

  readonly clockValues = computed(() => {
    if (this.timeView() === 'hours') {
      return this.getHourValues();
    }
    return this.getMinuteValues();
  });

  readonly selectedAngle = computed((): number | null => {
    if (this.timeView() === 'hours') {
      const h = this.hours();
      if (this.use24Hour()) {
        if (h === 0) return 0;
        if (h > 12) return ((h - 12) / 12) * 360;
        return (h / 12) * 360;
      }
      const h12 = h % 12;
      return (h12 / 12) * 360;
    } else {
      return (this.minutes() / 60) * 360;
    }
  });

  constructor() {
    const time = this.selectedTime();
    if (time) {
      this.hours.set(time.getHours());
      this.minutes.set(time.getMinutes());
      this.period.set(time.getHours() >= 12 ? 'PM' : 'AM');
    }
  }

  setTimeView(view: TimeView): void {
    this.timeView.set(view);
  }

  setPeriod(p: TimePeriod): void {
    this.period.set(p);
    let h = this.hours();
    if (p === 'AM' && h >= 12) {
      h -= 12;
    } else if (p === 'PM' && h < 12) {
      h += 12;
    }
    this.hours.set(h);
    this.emitTime();
  }

  selectClockValue(value: number): void {
    if (this.timeView() === 'hours') {
      let h = value;
      if (!this.use24Hour()) {
        if (this.period() === 'PM' && h < 12) h += 12;
        if (this.period() === 'AM' && h === 12) h = 0;
      }
      this.hours.set(h);
      // Auto-advance to minutes after hour selection
      this.timeView.set('minutes');
    } else {
      this.minutes.set(value);
    }
    this.emitTime();
  }

  getClockNumberTransform(angle: number, isInner: boolean): string {
    const radius = isInner ? 75 : 110;
    const rad = ((angle - 90) * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    return `translate(${x}px, ${y}px)`;
  }

  private getHourValues(): Array<{
    value: number;
    display: string;
    angle: number;
    isSelected: boolean;
    isInner: boolean;
  }> {
    const currentHour = this.hours();

    if (this.use24Hour()) {
      const values = [];
      // Outer ring: 1-12
      for (let i = 1; i <= 12; i++) {
        values.push({
          value: i,
          display: i.toString(),
          angle: (i / 12) * 360,
          isSelected: currentHour === i,
          isInner: false,
        });
      }
      // Inner ring: 13-24 (0)
      for (let i = 13; i <= 24; i++) {
        const display = i === 24 ? '00' : i.toString();
        const val = i === 24 ? 0 : i;
        values.push({
          value: val,
          display,
          angle: ((i - 12) / 12) * 360,
          isSelected: currentHour === val,
          isInner: true,
        });
      }
      return values;
    }

    const values = [];
    for (let i = 1; i <= 12; i++) {
      const displayHour = i;
      values.push({
        value: i,
        display: displayHour.toString(),
        angle: (i / 12) * 360,
        isSelected: (currentHour % 12 || 12) === i,
        isInner: false,
      });
    }
    return values;
  }

  private getMinuteValues(): Array<{
    value: number;
    display: string;
    angle: number;
    isSelected: boolean;
    isInner: boolean;
  }> {
    const currentMinute = this.minutes();
    const values = [];
    for (let i = 0; i < 60; i += 5) {
      values.push({
        value: i,
        display: i.toString().padStart(2, '0'),
        angle: (i / 60) * 360,
        isSelected: currentMinute === i,
        isInner: false,
      });
    }
    return values;
  }

  private emitTime(): void {
    const date = this.selectedTime() ? new Date(this.selectedTime()!.getTime()) : new Date();
    date.setHours(this.hours(), this.minutes(), 0, 0);
    this.timeSelected.emit(date);
  }
}
