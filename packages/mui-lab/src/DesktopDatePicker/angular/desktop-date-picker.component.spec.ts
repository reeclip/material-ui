import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { By } from '@angular/platform-browser';
import { DesktopDatePickerComponent } from './desktop-date-picker.component';
import { CalendarPanelComponent } from './calendar-panel.component';

// Test host component for ngModel binding
@Component({
  standalone: true,
  imports: [DesktopDatePickerComponent, FormsModule],
  template: `
    <mui-desktop-date-picker
      label="Test Date"
      [(ngModel)]="date"
      [minDate]="minDate"
      [maxDate]="maxDate"
      [disabled]="disabled"
    />
  `,
})
class TestHostComponent {
  date: Date | null = null;
  minDate?: Date;
  maxDate?: Date;
  disabled = false;
}

// Test host component for reactive forms
@Component({
  standalone: true,
  imports: [DesktopDatePickerComponent, ReactiveFormsModule],
  template: `
    <mui-desktop-date-picker label="Reactive Date" [formControl]="dateControl" />
  `,
})
class ReactiveTestHostComponent {
  dateControl = new FormControl<Date | null>(null);
}

describe('DesktopDatePickerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, OverlayModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    const picker = fixture.debugElement.query(
      By.directive(DesktopDatePickerComponent),
    );
    expect(picker).toBeTruthy();
  });

  it('should render the label', () => {
    const label = fixture.debugElement.query(
      By.css('.mui-date-picker-label'),
    );
    expect(label.nativeElement.textContent.trim()).toBe('Test Date');
  });

  it('should display formatted date when a value is set', async () => {
    hostComponent.date = new Date(2024, 0, 15); // Jan 15 2024
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.debugElement.query(
      By.css('.mui-date-picker-input'),
    );
    expect(input.nativeElement.value).toBe('01/15/2024');
  });

  it('should open the calendar popover on input click', () => {
    const input = fixture.debugElement.query(
      By.css('.mui-date-picker-input'),
    );
    input.nativeElement.click();
    fixture.detectChanges();

    const picker = fixture.debugElement.query(
      By.directive(DesktopDatePickerComponent),
    );
    expect(picker.componentInstance.isOpen()).toBe(true);
  });

  it('should open the calendar popover on toggle button click', () => {
    const toggle = fixture.debugElement.query(
      By.css('.mui-date-picker-toggle'),
    );
    toggle.nativeElement.click();
    fixture.detectChanges();

    const picker = fixture.debugElement.query(
      By.directive(DesktopDatePickerComponent),
    );
    expect(picker.componentInstance.isOpen()).toBe(true);
  });

  it('should not open when disabled', () => {
    hostComponent.disabled = true;
    fixture.detectChanges();

    const input = fixture.debugElement.query(
      By.css('.mui-date-picker-input'),
    );
    input.nativeElement.click();
    fixture.detectChanges();

    const picker = fixture.debugElement.query(
      By.directive(DesktopDatePickerComponent),
    );
    expect(picker.componentInstance.isOpen()).toBe(false);
  });

  it('should apply disabled styling', () => {
    hostComponent.disabled = true;
    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(
      By.css('.mui-date-picker-input-wrapper'),
    );
    expect(wrapper.nativeElement.classList).toContain('mui-disabled');
  });

  it('should close on Escape key', () => {
    const picker = fixture.debugElement.query(
      By.directive(DesktopDatePickerComponent),
    );
    picker.componentInstance.openPicker();
    fixture.detectChanges();
    expect(picker.componentInstance.isOpen()).toBe(true);

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    picker.nativeElement.dispatchEvent(event);
    fixture.detectChanges();

    expect(picker.componentInstance.isOpen()).toBe(false);
  });

  it('should emit dateChange when a date is selected', () => {
    const picker = fixture.debugElement.query(
      By.directive(DesktopDatePickerComponent),
    );
    const spy = spyOn(picker.componentInstance.dateChange, 'emit');

    const testDate = new Date(2024, 5, 15);
    picker.componentInstance.onDateSelected(testDate);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(testDate);
  });

  it('should close the popover after selecting a date', () => {
    const picker = fixture.debugElement.query(
      By.directive(DesktopDatePickerComponent),
    );
    picker.componentInstance.openPicker();
    fixture.detectChanges();

    picker.componentInstance.onDateSelected(new Date(2024, 5, 15));
    fixture.detectChanges();

    expect(picker.componentInstance.isOpen()).toBe(false);
  });

  it('should have correct ARIA attributes on the input', () => {
    const input = fixture.debugElement.query(
      By.css('.mui-date-picker-input'),
    );
    expect(input.nativeElement.getAttribute('role')).toBe('combobox');
    expect(input.nativeElement.getAttribute('aria-haspopup')).toBe('dialog');
    expect(input.nativeElement.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('DesktopDatePickerComponent with ReactiveFormsModule', () => {
  let fixture: ComponentFixture<ReactiveTestHostComponent>;
  let hostComponent: ReactiveTestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveTestHostComponent, OverlayModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ReactiveTestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should work with reactive forms', () => {
    const testDate = new Date(2024, 2, 20);
    hostComponent.dateControl.setValue(testDate);
    fixture.detectChanges();

    const input = fixture.debugElement.query(
      By.css('.mui-date-picker-input'),
    );
    expect(input.nativeElement.value).toBe('03/20/2024');
  });

  it('should propagate changes to the form control', () => {
    const picker = fixture.debugElement.query(
      By.directive(DesktopDatePickerComponent),
    );
    const testDate = new Date(2024, 8, 10);
    picker.componentInstance.onDateSelected(testDate);
    fixture.detectChanges();

    expect(hostComponent.dateControl.value).toEqual(testDate);
  });
});

describe('CalendarPanelComponent', () => {
  let fixture: ComponentFixture<CalendarPanelComponent>;
  let component: CalendarPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render 42 day cells (6 weeks)', () => {
    const days = fixture.debugElement.queryAll(By.css('.mui-calendar-day'));
    expect(days.length).toBe(42);
  });

  it('should highlight today', () => {
    const todayCell = fixture.debugElement.query(By.css('.mui-today'));
    expect(todayCell).toBeTruthy();
  });

  it('should navigate to next month', () => {
    const initialMonth = component.viewMonth();
    const nextBtn = fixture.debugElement.queryAll(
      By.css('.mui-calendar-nav-btn'),
    )[1];
    nextBtn.nativeElement.click();
    fixture.detectChanges();

    const expected = initialMonth === 11 ? 0 : initialMonth + 1;
    expect(component.viewMonth()).toBe(expected);
  });

  it('should navigate to previous month', () => {
    const initialMonth = component.viewMonth();
    const prevBtn = fixture.debugElement.queryAll(
      By.css('.mui-calendar-nav-btn'),
    )[0];
    prevBtn.nativeElement.click();
    fixture.detectChanges();

    const expected = initialMonth === 0 ? 11 : initialMonth - 1;
    expect(component.viewMonth()).toBe(expected);
  });

  it('should emit dateSelected when a day is clicked', () => {
    const spy = spyOn(component.dateSelected, 'emit');
    const dayButtons = fixture.debugElement.queryAll(
      By.css('.mui-calendar-day:not(.mui-disabled)'),
    );
    dayButtons[10].nativeElement.click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();
  });

  it('should switch views when header label is clicked', () => {
    expect(component.activeView()).toBe('days');

    const headerLabel = fixture.debugElement.query(
      By.css('.mui-calendar-header-label'),
    );
    headerLabel.nativeElement.click();
    fixture.detectChanges();

    expect(component.activeView()).toBe('months');
  });

  it('should select a month and switch back to day view', () => {
    component.activeView.set('months');
    fixture.detectChanges();

    const monthCells = fixture.debugElement.queryAll(
      By.css('.mui-calendar-month-cell'),
    );
    monthCells[5].nativeElement.click(); // June
    fixture.detectChanges();

    expect(component.viewMonth()).toBe(5);
    expect(component.activeView()).toBe('days');
  });

  it('should disable dates outside min/max range', () => {
    component.minDate = new Date(2024, 0, 10);
    component.maxDate = new Date(2024, 0, 20);
    component.viewMonth.set(0);
    component.viewYear.set(2024);
    fixture.detectChanges();

    const disabledDays = fixture.debugElement.queryAll(
      By.css('.mui-calendar-day.mui-disabled'),
    );
    expect(disabledDays.length).toBeGreaterThan(0);
  });

  it('should navigate with arrow keys', () => {
    const testDate = new Date(2024, 5, 15);
    component.value = testDate;
    fixture.detectChanges();

    const panel = fixture.debugElement.query(By.css('.mui-calendar-panel'));
    panel.triggerEventHandler('keydown', {
      key: 'ArrowRight',
      preventDefault: () => {},
    });
    fixture.detectChanges();

    expect(component._value()?.getDate()).toBe(16);
  });
});
