import EventEmitter from '../eventManager.js';

export default class Module extends EventEmitter {
  /** @type {import('./editor.js').default} */
  #editor;
  /** @type {AbortController?} */
  #controller = new AbortController();

  constructor(instance) {
    super();
    this.#editor = instance;
    this.#controller.signal.addEventListener('abort', () => this.#controller = new AbortController());
  }

  get container() {
    return this.instance.container;
  }

  get element() {
    return this.instance.element;
  }

  get instance() {
    return this.#editor;
  }

  get signal() {
    return this.#controller.signal;
  }

  // TODO: simplify this?
  init() {
    const { container, element, instance, signal } = this;

    // Bind generic events
    container.querySelectorAll('input[name]:not([type="file"], [type="number"], .external > input)').forEach((input) => {
      const key = input.name;
      input.value = element[key];
      input.addEventListener('input', () => {
        instance.update(input.value, key);
      }, { signal });
    });

    /** @type {HTMLTextAreaElement} */
    const descriptionInput = container.querySelector('textarea[name="description"]');
    descriptionInput.value = element.description;
    function updateDescription() {
      // TODO strip open ended brackets from value?
      instance.update(descriptionInput.value, 'description');
    }
    descriptionInput.addEventListener('input', updateDescription, { signal });

    // Generic hide soul
    container.querySelector('fieldset.soul').classList.add('hidden');

    // Clear upload and url text
    container.querySelectorAll('.external input').forEach((el) => el.value = '');

    this.on('click', (key) => {
      const el = container.querySelector(`[name="${key}"]`);
      if (!el) return;
      el.focus();
      if (el.type === 'number') el.select();
    }, { signal });

    // Keywords
    container.querySelectorAll('.keywords > span:not([data-ignore])').forEach(
      /** @param {HTMLSpanElement} el  */
      (el) => {
        el.addEventListener('click', (e) => {
          const { selectionEnd: end, selectionStart: start, value } = descriptionInput;
          const { insert = el.textContent } = el.dataset;
          const before = value.substring(0, start);
          const after = value.substring(end);
          const open = insert.indexOf('[');
          if (!~open) {
            descriptionInput.value = `${before}${insert}${after}`;
            const pos = start + insert.length;
            descriptionInput.selectionStart = pos;
            descriptionInput.selectionEnd = pos;
          } else {
            const { extra = '' } = e.target.dataset;
            const close = insert.indexOf(']');
            const first = insert.substring(0, open);
            const last = insert.substring(close + 1);
            const text = value.substring(start, end) || insert.substring(open + 1, close);
            descriptionInput.value = `${before}${first}${text}${extra}${last}${after}`;
            const offset = start + open;
            descriptionInput.selectionStart = offset;
            descriptionInput.selectionEnd = offset + text.length;
            if (insert.includes('#')) {
              // TODO color picker
            }
          }
          updateDescription();
          descriptionInput.focus();
        }, { signal });
      },
    );
  }

  unload() {
    this.#controller.abort();
  }
}
