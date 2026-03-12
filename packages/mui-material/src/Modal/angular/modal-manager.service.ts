import { Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';

export interface ManagedModalProps {
  disableScrollLock?: boolean;
}

interface ModalRef {
  mount: Element;
  modalRef: Element;
}

interface ContainerInfo {
  container: HTMLElement;
  hiddenSiblings: Element[];
  modals: ModalRef[];
  restore: (() => void) | null;
}

function isOverflowing(container: Element): boolean {
  const doc = container.ownerDocument;
  if (doc.body === container) {
    const win = doc.defaultView || window;
    return win.innerWidth > doc.documentElement.clientWidth;
  }
  return container.scrollHeight > container.clientHeight;
}

export function ariaHidden(element: Element, hide: boolean): void {
  if (hide) {
    element.setAttribute('aria-hidden', 'true');
  } else {
    element.removeAttribute('aria-hidden');
  }
}

function getPaddingRight(element: Element): number {
  const win = element.ownerDocument.defaultView || window;
  return parseFloat(win.getComputedStyle(element).paddingRight) || 0;
}

function isAriaHiddenForbiddenOnElement(element: Element): boolean {
  const forbiddenTagNames = [
    'TEMPLATE', 'SCRIPT', 'STYLE', 'LINK', 'MAP', 'META',
    'NOSCRIPT', 'PICTURE', 'COL', 'COLGROUP', 'PARAM', 'SLOT', 'SOURCE', 'TRACK',
  ];
  const isForbiddenTagName = forbiddenTagNames.includes(element.tagName);
  const isInputHidden = element.tagName === 'INPUT' && element.getAttribute('type') === 'hidden';
  return isForbiddenTagName || isInputHidden;
}

function ariaHiddenSiblings(
  container: Element,
  mountElement: Element,
  currentElement: Element,
  elementsToExclude: readonly Element[],
  hide: boolean,
): void {
  const excludeList = [mountElement, currentElement, ...elementsToExclude];
  Array.from(container.children).forEach((element: Element) => {
    if (!excludeList.includes(element) && !isAriaHiddenForbiddenOnElement(element)) {
      ariaHidden(element, hide);
    }
  });
}

function getScrollbarSize(win: Window): number {
  const scrollDiv = win.document.createElement('div');
  scrollDiv.style.width = '99px';
  scrollDiv.style.height = '99px';
  scrollDiv.style.position = 'absolute';
  scrollDiv.style.top = '-9999px';
  scrollDiv.style.overflow = 'scroll';
  win.document.body.appendChild(scrollDiv);
  const scrollbarSize = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  win.document.body.removeChild(scrollDiv);
  return scrollbarSize;
}

function getHiddenSiblings(container: Element): Element[] {
  const hiddenSiblings: Element[] = [];
  Array.from(container.children).forEach((element: Element) => {
    if (element.getAttribute('aria-hidden') === 'true') {
      hiddenSiblings.push(element);
    }
  });
  return hiddenSiblings;
}

function handleContainer(containerInfo: ContainerInfo, props: ManagedModalProps): () => void {
  const restoreStyle: Array<{ property: string; el: HTMLElement; value: string }> = [];
  const container = containerInfo.container;

  if (!props.disableScrollLock) {
    if (isOverflowing(container)) {
      const win = container.ownerDocument.defaultView || window;
      const scrollbarSize = getScrollbarSize(win);

      restoreStyle.push({
        value: container.style.paddingRight,
        property: 'padding-right',
        el: container,
      });
      container.style.paddingRight = `${getPaddingRight(container) + scrollbarSize}px`;

      const fixedElements = container.ownerDocument.querySelectorAll('.mui-fixed');
      fixedElements.forEach((element: Element) => {
        const htmlEl = element as HTMLElement;
        restoreStyle.push({
          value: htmlEl.style.paddingRight,
          property: 'padding-right',
          el: htmlEl,
        });
        htmlEl.style.paddingRight = `${getPaddingRight(element) + scrollbarSize}px`;
      });
    }

    let scrollContainer: HTMLElement;
    if (container.parentNode instanceof DocumentFragment) {
      scrollContainer = container.ownerDocument.body;
    } else {
      const parent = container.parentElement;
      const containerWindow = container.ownerDocument.defaultView || window;
      scrollContainer =
        parent?.nodeName === 'HTML' &&
        containerWindow.getComputedStyle(parent).overflowY === 'scroll'
          ? parent
          : container;
    }

    restoreStyle.push(
      { value: scrollContainer.style.overflow, property: 'overflow', el: scrollContainer },
      { value: scrollContainer.style.overflowX, property: 'overflow-x', el: scrollContainer },
      { value: scrollContainer.style.overflowY, property: 'overflow-y', el: scrollContainer },
    );
    scrollContainer.style.overflow = 'hidden';
  }

  return () => {
    restoreStyle.forEach(({ value, el, property }) => {
      if (value) {
        el.style.setProperty(property, value);
      } else {
        el.style.removeProperty(property);
      }
    });
  };
}

/**
 * Manages multiple modals, scroll locking, and aria-hidden state.
 * Ported from MUI's React ModalManager.
 */
@Injectable({ providedIn: 'root' })
export class ModalManagerService {
  private containers: ContainerInfo[] = [];
  private modals: ModalRef[] = [];

  add(modal: ModalRef, container: HTMLElement): number {
    let modalIndex = this.modals.indexOf(modal);
    if (modalIndex !== -1) {
      return modalIndex;
    }

    modalIndex = this.modals.length;
    this.modals.push(modal);

    if (modal.modalRef) {
      ariaHidden(modal.modalRef, false);
    }

    const hiddenSiblings = getHiddenSiblings(container);
    ariaHiddenSiblings(container, modal.mount, modal.modalRef, hiddenSiblings, true);

    const containerIndex = this.containers.findIndex((item) => item.container === container);
    if (containerIndex !== -1) {
      this.containers[containerIndex].modals.push(modal);
      return modalIndex;
    }

    this.containers.push({
      modals: [modal],
      container,
      restore: null,
      hiddenSiblings,
    });

    return modalIndex;
  }

  mount(modal: ModalRef, props: ManagedModalProps): void {
    const containerIndex = this.containers.findIndex((item) => item.modals.includes(modal));
    const containerInfo = this.containers[containerIndex];

    if (!containerInfo.restore) {
      containerInfo.restore = handleContainer(containerInfo, props);
    }
  }

  remove(modal: ModalRef, ariaHiddenState = true): number {
    const modalIndex = this.modals.indexOf(modal);
    if (modalIndex === -1) {
      return modalIndex;
    }

    const containerIndex = this.containers.findIndex((item) => item.modals.includes(modal));
    const containerInfo = this.containers[containerIndex];

    containerInfo.modals.splice(containerInfo.modals.indexOf(modal), 1);
    this.modals.splice(modalIndex, 1);

    if (containerInfo.modals.length === 0) {
      if (containerInfo.restore) {
        containerInfo.restore();
      }
      if (modal.modalRef) {
        ariaHidden(modal.modalRef, ariaHiddenState);
      }
      ariaHiddenSiblings(
        containerInfo.container,
        modal.mount,
        modal.modalRef,
        containerInfo.hiddenSiblings,
        false,
      );
      this.containers.splice(containerIndex, 1);
    } else {
      const nextTop = containerInfo.modals[containerInfo.modals.length - 1];
      if (nextTop.modalRef) {
        ariaHidden(nextTop.modalRef, false);
      }
    }

    return modalIndex;
  }

  isTopModal(modal: ModalRef): boolean {
    return this.modals.length > 0 && this.modals[this.modals.length - 1] === modal;
  }
}
