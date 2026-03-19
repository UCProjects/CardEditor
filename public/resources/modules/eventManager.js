import { tryOrErrorSync } from './toast/index.js';

export default class EventEmitter {
  /** @type {Record<string, Function[]} */
  #events = {};

  /**
   * @param {string} event
   * @param {(...args: any[]) => void} fn
   * @param {{
   *  signal?: AbortSignal;
   * }} options
   */
  on(event, fn, options = {}) {
    this.#events[event] ||= [];
    this.#events[event].push(fn);
    options.signal?.addEventListener('abort', () => {
      this.off(event, fn);
    }, { once: true });
    return this;
  }

  /**
   * @param {string} event
   * @param {(...args: any[]) => void} fn
   * @param {{
   *  signal?: AbortSignal;
   * }} options
   */
  one(event, fn, options) {
    const controller = new AbortController();
    return this.on(event, (...args) => {
      fn(...args);
      controller.abort();
    }, {
      ...options,
      signal: AbortSignal.any([controller.signal, options?.signal].filter(_ => _)),
    });
  }

  /**
   * @param {string} event
   * @param {(...args: any[]) => void} fn
   */
  off(event, fn) {
    const events = this.#events[event];
    if (!events?.length) return;
    while (events.includes(fn)) {
      events.splice(events.indexOf(fn), 1);
    }
  }

  /** @param {string} event */
  emit(event, ...args) {
    const events = this.#events[event] || [];
    [...events].forEach(fn => tryOrErrorSync(() => fn(...args)));
  }
}
