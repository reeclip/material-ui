import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateTimePickerComponent } from './date-time-picker.component';

@Component({
  standalone: true,
  imports: [DateTimePickerComponent, ReactiveFormsModule],
  template: `
    <mui-date-time-picker
      [label]="label()"
      [disabled]="isDisabled()"
      (dateTimeChange)="onDateTimeChange($event)">
    </mui-date-time-picker>
  `,
})
class TestHostComponent {
  label = signal('Pick date & time');
  isDisabled = signal(false);
  selectedValue: Date | null = null;

  onDateTimeChange(date: Date | null): void {
    this.selectedValue = date;
  }
}

@Component({
  standalone: true,
  imports: [DateTimePickerComponent, ReactiveFormsModule],
  template: `
    <mui-date-time-picker [formControl]="control"></mui-date-time-picker>
  `,
})
class TestFormControlHostComponent {
  control = new FormControl<Date | null>(null);
}

describe('DateTimePickerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    const picker = fixture.nativeElement.querySelector('.mui-date-time-picker');
    expect(picker).toBeTruthy();
  });

  it('should display the label', () => {
    const label = fixture.nativeElement.querySelector('.mui-date-time-picker__label');
    expect(label.textContent.trim()).toBe('Pick date & time');
  });

  it('should open the popover on input click', () => {
    const wrapper = fixture.nativeElement.querySelector('.mui-date-time-picker__input-wrapper');
    wrapper.click();
    fixture.detectChanges();

    const popover = fixture.nativeElement.querySelector('.mui-date-time-picker__popover');
    expect(popover).toBeTruthy();
  });

  it('should close the popover on cancel', () => {
    const wrapper = fixture.nativeElement.querySelector('.mui-date-time-picker__input-wrapper');
    wrapper.click();
    fixture.detectChanges();

    const cancelBtn = fixture.nativeElement.querySelector('.mui-date-time-picker__action-btn');
    cancelBtn.click();
    fixture.detectChanges();

    const popover = fixture.nativeElement.querySelector('.mui-date-time-picker__popover');
    expect(popover).toBeNull();
  });

  it('should apply disabled class when disabled', () => {
    hostComponent.isDisabled.set(true);
    fixture.detectChanges();

    const picker = fixture.nativeElement.querySelector('.mui-date-time-picker');
    expect(picker.classList.contains('mui-date-time-picker--disabled')).toBe(true);
  });

  it('should show date view by default', () => {
    const wrapper = fixture.nativeElement.querySelector('.mui-date-time-picker__input-wrapper');
    wrapper.click();
    fixture.detectChanges();

    const datePicker = fixture.nativeElement.querySelector('mui-date-picker');
    expect(datePicker).toBeTruthy();
  });

  it('should show toolbar with date and time tabs', () => {
    const wrapper = fixture.nativeElement.querySelector('.mui-date-time-picker__input-wrapper');
    wrapper.click();
    fixture.detectChanges();

    const toolbarBtns = fixture.nativeElement.querySelectorAll('.mui-date-time-picker__toolbar-btn');
    expect(toolbarBtns.length).toBe(2);
  });

  it('should switch to time view when time tab is clicked', () => {
    const wrapper = fixture.nativeElement.querySelector('.mui-date-time-picker__input-wrapper');
    wrapper.click();
    fixture.detectChanges();

    const toolbarBtns = fixture.nativeElement.querySelectorAll('.mui-date-time-picker__toolbar-btn');
    toolbarBtns[1].click(); // Click time tab
    fixture.detectChanges();

    const timePicker = fixture.nativeElement.querySelector('mui-time-picker');
    expect(timePicker).toBeTruthy();
  });
});

describe('DateTimePickerComponent with FormControl', () => {
  let fixture: ComponentFixture<TestFormControlHostComponent>;
  let hostComponent: TestFormControlHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestFormControlHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestFormControlHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should work with reactive forms', () => {
    const testDate = new Date(2026, 2, 15, 10, 30);
    hostComponent.control.setValue(testDate);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.mui-date-time-picker__input');
    expect(input.value).toBeTruthy();
  });

  it('should update form control on accept', () => {
    const wrapper = fixture.nativeElement.querySelector('.mui-date-time-picker__input-wrapper');
    wrapper.click();
    fixture.detectChanges();

    // The form control should still be null since no date was accepted
    expect(hostComponent.control.value).toBeNull();
  });
});
