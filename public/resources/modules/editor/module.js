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

    // Bind generic events
    container.querySelectorAll('input[name]').forEach((input) => {
      const key = input.name;
      input.value = element[key];
      input.addEventListener('input', () => {
        instance.update(input.value, key);
      }, { signal });
    });

    const descriptionInput = container.querySelector('textarea[name="description"]');
    descriptionInput.value = element.description;
    descriptionInput.addEventListener('input', (event) => {
      // TODO strip open ended brackets from value
      instance.update(event.currentTarget.value, 'description');
    }, { signal });

    // Generic hide soul
    container.querySelector('fieldset.soul').style.display = 'none';


    this.on('click', (key) => {
      container.querySelector(`input[name="${key}"], textarea[name="${key}"]`)?.focus();
    }, { signal });
  }

  unload() {
    this.#controller?.abort();
    this.#controller = null;
  }
}
