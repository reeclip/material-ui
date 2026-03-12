import { NgModule } from '@angular/core';
import { DateTimePickerComponent } from './date-time-picker.component';
import { DatePickerComponent } from './date-picker.component';
import { TimePickerComponent } from './time-picker.component';

/**
 * Optional NgModule for non-standalone usage.
 * Prefer importing standalone components directly in modern Angular apps.
 */
@NgModule({
  imports: [DateTimePickerComponent, DatePickerComponent, TimePickerComponent],
  exports: [DateTimePickerComponent, DatePickerComponent, TimePickerComponent],
})
export class DateTimePickerModule {}
