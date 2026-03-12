import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Renderer2,
  Inject,
  NgZone,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ModalManagerService, ariaHidden } from './modal-manager.service';

export type ModalCloseReason = 'backdropClick' | 'escapeKeyDown';

/**
 * MuiModal - Angular port of Material UI's Modal component.
 *
 * A lower-level construct that provides:
 * - Backdrop rendering
 * - Focus trapping
 * - Scroll locking
 * - Aria management for accessibility
 * - Support for multiple stacked modals
 *
 * Usage:
 * ```html
 * <mui-modal [open]="isOpen" (closeModal)="isOpen = false">
 *   <div class="modal-content">
 *     <h2>Modal Title</h2>
 *     <p>Modal content goes here.</p>
 *   </div>
 * </mui-modal>
 * ```
 */
@Component({
  selector: 'mui-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="shouldRender">
      <div
        #modalRoot
        class="MuiModal-root"
        [class.MuiModal-hidden]="!open && exited"
        [attr.role]="'presentation'"
        (keydown)="onKeyDown($event)"
      >
        <div
          *ngIf="!hideBackdrop"
          class="MuiModal-backdrop"
          [class]="backdropClass"
          [attr.aria-hidden]="true"
          (click)="onBackdropClick($event)"
        ></div>
        <div #focusTrapSentinelStart tabindex="0" class="mui-focus-trap-sentinel" style="position:fixed;opacity:0;pointer-events:none;"></div>
        <div #contentWrapper class="MuiModal-content">
          <ng-content></ng-content>
        </div>
        <div #focusTrapSentinelEnd tabindex="0" class="mui-focus-trap-sentinel" style="position:fixed;opacity:0;pointer-events:none;"></div>
      </div>
    </ng-container>
  `,
  styles: [`
    .MuiModal-root {
      position: fixed;
      z-index: 1300;
      right: 0;
      bottom: 0;
      top: 0;
      left: 0;
    }

    .MuiModal-hidden {
      visibility: hidden;
    }

    .MuiModal-backdrop {
      position: fixed;
      display: flex;
      align-items: center;
      justify-content: center;
      right: 0;
      bottom: 0;
      top: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.5);
      -webkit-tap-highlight-color: transparent;
      z-index: -1;
    }

    .MuiModal-content {
      outline: 0;
    }

    .mui-focus-trap-sentinel {
      width: 0;
      height: 0;
      overflow: hidden;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MuiModalComponent implements OnChanges, OnDestroy, AfterViewInit {
  /** If true, the component is shown. */
  @Input() open = false;

  /** When set to true, the Modal waits until a nested Transition is completed before closing. */
  @Input() closeAfterTransition = false;

  /** If true, the modal will not automatically shift focus to itself when it opens. */
  @Input() disableAutoFocus = false;

  /** If true, the modal will not prevent focus from leaving the modal while open. */
  @Input() disableEnforceFocus = false;

  /** If true, the modal will not restore focus to previously focused element once closed. */
  @Input() disableRestoreFocus = false;

  /** Disable the scroll lock behavior. */
  @Input() disableScrollLock = false;

  /** If true, the backdrop is not rendered. */
  @Input() hideBackdrop = false;

  /** Always keep the children in the DOM. */
  @Input() keepMounted = false;

  /** Custom CSS class for the backdrop. */
  @Input() backdropClass = '';

  /** Custom CSS class for the root element. */
  @Input() rootClass = '';

  /** Container element to render the modal into (for portal behavior). */
  @Input() container: HTMLElement | null = null;

  /** Callback fired when the component requests to be closed. */
  @Output() closeModal = new EventEmitter<{ event: Event; reason: ModalCloseReason }>();

  /** A function called when a transition enters. */
  @Output() transitionEnter = new EventEmitter<void>();

  /** A function called when a transition has exited. */
  @Output() transitionExited = new EventEmitter<void>();

  @ViewChild('modalRoot') modalRootRef!: ElementRef<HTMLDivElement>;
  @ViewChild('contentWrapper') contentWrapperRef!: ElementRef<HTMLDivElement>;
  @ViewChild('focusTrapSentinelStart') sentinelStartRef!: ElementRef<HTMLDivElement>;
  @ViewChild('focusTrapSentinelEnd') sentinelEndRef!: ElementRef<HTMLDivElement>;

  exited = true;

  private modal: { mount: Element; modalRef: Element } = {} as any;
  private previouslyFocusedElement: Element | null = null;
  private focusTrapListener: (() => void) | null = null;
  private initialized = false;

  get shouldRender(): boolean {
    if (this.keepMounted) {
      return true;
    }
    return this.open || !this.exited;
  }

  constructor(
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private ngZone: NgZone,
    private modalManager: ModalManagerService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngAfterViewInit(): void {
    this.initialized = true;
    if (this.open) {
      this.handleOpen();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.initialized) {
      if (this.open) {
        this.exited = false;
        this.cdr.markForCheck();
        // Use setTimeout to ensure the view is rendered before handling open
        setTimeout(() => this.handleOpen());
      } else {
        if (!this.closeAfterTransition) {
          this.handleClose();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.handleClose();
    this.removeFocusTrap();
  }

  onKeyDown(event: KeyboardEvent): void {
    // Wait until IME is settled
    if (event.key !== 'Escape' || (event as any).which === 229) {
      return;
    }

    if (!this.modalManager.isTopModal(this.modal)) {
      return;
    }

    event.stopPropagation();
    this.closeModal.emit({ event, reason: 'escapeKeyDown' });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    this.closeModal.emit({ event, reason: 'backdropClick' });
  }

  /** Call this method when your transition animation starts. */
  notifyTransitionEnter(): void {
    this.exited = false;
    this.transitionEnter.emit();
    this.cdr.markForCheck();
  }

  /** Call this method when your transition animation completes. */
  notifyTransitionExited(): void {
    this.exited = true;
    this.transitionExited.emit();

    if (this.closeAfterTransition) {
      this.handleClose();
    }
    this.cdr.markForCheck();
  }

  private handleOpen(): void {
    if (!this.modalRootRef) {
      return;
    }

    const resolvedContainer = this.container || this.document.body;

    this.modal.modalRef = this.modalRootRef.nativeElement;
    this.modal.mount = this.elementRef.nativeElement;

    this.modalManager.add(this.modal, resolvedContainer as HTMLElement);
    this.modalManager.mount(this.modal, { disableScrollLock: this.disableScrollLock });

    // Reset scroll
    if (this.modalRootRef.nativeElement) {
      this.modalRootRef.nativeElement.scrollTop = 0;
    }

    // Focus management
    if (!this.disableAutoFocus) {
      this.previouslyFocusedElement = this.document.activeElement;
      this.focusModal();
    }

    // Set up focus trap
    if (!this.disableEnforceFocus) {
      this.setupFocusTrap();
    }
  }

  private handleClose(): void {
    this.modalManager.remove(this.modal, true);
    this.removeFocusTrap();

    // Restore focus
    if (!this.disableRestoreFocus && this.previouslyFocusedElement) {
      (this.previouslyFocusedElement as HTMLElement).focus?.();
      this.previouslyFocusedElement = null;
    }

    this.exited = true;
    this.cdr.markForCheck();
  }

  private focusModal(): void {
    if (!this.contentWrapperRef) {
      return;
    }
    const content = this.contentWrapperRef.nativeElement;
    // Try to focus the first focusable element within the content
    const focusable = content.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable) {
      focusable.focus();
    } else {
      // If no focusable element found, focus the content wrapper itself
      content.setAttribute('tabindex', '-1');
      content.focus();
    }
  }

  private setupFocusTrap(): void {
    this.removeFocusTrap();

    this.ngZone.runOutsideAngular(() => {
      this.focusTrapListener = this.renderer.listen(this.document, 'focus', (event: FocusEvent) => {
        if (!this.open || !this.modalManager.isTopModal(this.modal)) {
          return;
        }

        const modalRoot = this.modalRootRef?.nativeElement;
        if (!modalRoot) {
          return;
        }

        if (!modalRoot.contains(event.target as Node)) {
          event.stopPropagation();
          this.focusModal();
        }
      });
    });
  }

  private removeFocusTrap(): void {
    if (this.focusTrapListener) {
      this.focusTrapListener();
      this.focusTrapListener = null;
    }
  }
}
