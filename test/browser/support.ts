import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

declare global {
  interface Window {
    __resources: () => {
      resizeTargets: number;
      detachedResizeTargets: number;
      scrollListeners: number;
      detachedScrollListeners: number;
    };
  }
}

/** Instrument real observers/listeners; never replaces their behavior. */
export function trackResources() {
  const Native = window.ResizeObserver;
  const observations = new Map<ResizeObserver, Set<Element>>();
  window.ResizeObserver = class extends Native {
    constructor(callback: ResizeObserverCallback) {
      super(callback);
      observations.set(this, new Set());
    }
    observe(target: Element, options?: ResizeObserverOptions) {
      observations.get(this)!.add(target);
      super.observe(target, options);
    }
    unobserve(target: Element) {
      observations.get(this)!.delete(target);
      super.unobserve(target);
    }
    disconnect() {
      observations.get(this)!.clear();
      super.disconnect();
    }
  };
  const listeners = new Map<EventTarget, Set<EventListenerOrEventListenerObject>>();
  const add = EventTarget.prototype.addEventListener;
  const remove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (type, callback, options) {
    if (type === 'scroll' && callback) {
      const set = listeners.get(this) ?? new Set();
      set.add(callback);
      listeners.set(this, set);
    }
    add.call(this, type, callback, options);
  };
  EventTarget.prototype.removeEventListener = function (type, callback, options) {
    if (type === 'scroll' && callback) listeners.get(this)?.delete(callback);
    remove.call(this, type, callback, options);
  };
  window.__resources = () => {
    const targets = [...observations.values()].flatMap((set) => [...set]);
    const scroll = [...listeners].flatMap(([target, set]) => [...set].map(() => target));
    return {
      resizeTargets: targets.length,
      detachedResizeTargets: targets.filter((el) => !el.isConnected).length,
      scrollListeners: scroll.length,
      detachedScrollListeners: scroll.filter(
        (target) => target instanceof Element && !target.isConnected,
      ).length,
    };
  };
}

export async function verifyRecords(page: Page) {
  const records = await page.getByTestId('record').evaluateAll((nodes) =>
    nodes.map((node) => ({
      index: node.getAttribute('data-index'),
      id: node.getAttribute('data-id'),
      record: node.querySelector('[data-record]')?.getAttribute('data-record'),
      position: node.querySelector('[data-position]')?.getAttribute('data-position'),
      text: node.querySelector('.record-name')?.textContent?.trim(),
    })),
  );
  expect(records.length).toBeGreaterThan(0);
  expect(records.length).toBeLessThan(55);
  expect(new Set(records.map((row) => row.id)).size).toBe(records.length);
  expect(records.map((row) => Number(row.index))).toEqual(
    records.map((row) => Number(row.index)).toSorted((a, b) => a - b),
  );
  for (const row of records) {
    expect(row.record).toBe(row.id);
    expect(row.position).toBe(row.index);
    expect(row.text).toBe(`Record ${row.id}`);
  }
}

export async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

export async function visibleAnchor(
  page: Page,
  viewport: string,
  itemSelector: string,
  identityAttribute: string,
) {
  return page.getByTestId(viewport).evaluate(
    (element, { selector, attr }) => {
      const top = element.getBoundingClientRect().top;
      const node =
        [...element.querySelectorAll(selector)].find((candidate) => {
          const box = candidate.getBoundingClientRect();
          return box.top <= top + 1 && box.bottom > top + 1;
        }) ?? element.querySelector(selector);
      return { id: node?.getAttribute(attr), top: (node?.getBoundingClientRect().top ?? 0) - top };
    },
    { selector: itemSelector, attr: identityAttribute },
  );
}
