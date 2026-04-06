import Picker from '../color/picker.js';
import { isFullHex } from '../utils/color.js';
import EventEmitter from '../utils/EventEmitter.js';

const NAV_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);

export default class Module extends EventEmitter {
  /** @type {import('./editor.js').default} */
  #editor;
  /** @type {AbortController} */
  #controller = new AbortController();
  #picker;

  constructor(instance) {
    super();
    this.#editor = instance;

    this.#picker = new Picker(this.container.querySelector('textarea[name="description"]'));
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

  init() {
    const { container, element, instance, signal } = this;
    const picker = this.#picker;

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
      instance.update(descriptionInput.value, 'description');
      if (picker.isOpen) return;
      const pos = descriptionInput.selectionStart - 1;
      if (descriptionInput.value[pos] === '#') picker.open({ pos });
    }
    descriptionInput.addEventListener('input', updateDescription, { signal });


    function colorTokenAtCursor() {
      const value = descriptionInput.value;
      const pos = descriptionInput.selectionStart;
      const start = value.lastIndexOf('{', pos) + 1;
      if (!start || pos < start) return null;
      const close = value.indexOf('}', start);
      if (!!~close && close < pos) return null;
      const text = value.substring(start, pos);
      const [color, ...rest] = text.split('|');
      if (rest.length > 1) return null;
      const hash = color[0] === '#';
      const hex = color.substring(hash);
      return {
        pos: start,
        hex: isFullHex(hex) ? hex : null,
        focus: start + color.length >= pos,
      };
    }

    descriptionInput.addEventListener('keyup', (e) => {
      if (picker.isOpen || !NAV_KEYS.has(e.key)) return;
      const token = colorTokenAtCursor();
      if (token) picker.open(token);
    }, { signal });

    descriptionInput.addEventListener('keydown', (e) => {
      if (!picker.isOpen) return;
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        picker.close(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        picker.close(false);
      }
    }, { signal });

    descriptionInput.addEventListener('click', (e) => {
      if (picker.isOpen) return;
      setTimeout(() => {
        if (picker.isOpen) return;
        const token = colorTokenAtCursor();
        if (token) picker.open(token);
      });
    }, { signal });

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
            let offset = start + open;
            if (insert.includes('#')) {
              picker.open({
                pos: start + insert.indexOf('#'),
                focus: false,
              });
              offset += 6;
            }
            descriptionInput.setSelectionRange(offset, offset + text.length);
          }
          updateDescription();
          descriptionInput.focus();
        }, { signal });
      },
    );

    picker.on('updated', updateDescription, { signal });
  }

  unload() {
    this.#controller.abort();
    this.#controller = new AbortController();
  }
}
