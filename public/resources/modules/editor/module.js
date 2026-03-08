import EventEmitter from '../eventManager.js';

export default class Module extends EventEmitter {
  /** @type {import('./editor.js').default} */
  #editor;
  /** @type {AbortController?} */
  #controller;

  constructor(instance) {
    super();
    this.#editor = instance;
  }

  get instance() {
    return this.#editor;
  }

  get signal() {
    return this.#controller.signal;
  }

  get element() {
    return this.#editor.element;
  }

  // TODO: simplify this?
  init() {
    this.#controller?.abort();
    this.#controller = new AbortController();

    const { instance, signal } = this;
    const { container, element } = instance;

    // Bind the events
    const nameInput = container.querySelector('input[name="name"]');
    nameInput.value = element.name;
    nameInput.addEventListener('input', (event) => {
      this.#editor.update(event.currentTarget.value, 'name');
    }, { signal });
  }

  unload() {
    this.#controller?.abort();
    this.#controller = null;
  }
}
