import style from '../../styles/select.css' with { type: 'css' };
import EventEmitter from '../eventManager.js';
import { adoptStyle } from '../utils/funcs.js';

adoptStyle(style);

/** @type {HTMLTemplateElement} */
const template = document.getElementById('select');

function itemRenderer(item) {
  const ret = document.createElement('span');
  ret.textContent = item;
  return ret;
}

export default class Select extends EventEmitter {
  #options = [];
  #allOptions = [];
  #renderer = itemRenderer;
  /** @type {(opt: any) => string} */
  #getLabel;
  #button;
  #input;
  /** @type {HTMLUListElement} */
  #list;
  #active = -1;
  #currentValue = '';
  #placeholder = '';

  constructor(container, {
    items = [],
    renderer = itemRenderer,
    getLabel = (opt) => opt,
  } = {}) {
    super();
    this.#renderer = renderer;
    this.#getLabel = getLabel;

    this.#initWrapper(container);

    this.options = items;
  }

  get options() {
    return this.#allOptions;
  }

  set options(options = []) {
    this.#options = options;
    this.#allOptions = this.#options.flatMap((opt) => typeof opt === 'string' ? opt : opt.items);
    this.#active = -1;

    const empty = document.createElement('li');
    empty.classList.add('empty', 'hidden');
    empty.textContent = 'No matches found';

    const list = this.#list;
    list.innerHTML = '';
    list.appendChild(empty);
    options.forEach((opt) => {
      if (typeof opt === 'string') {
        list.appendChild(this.#makeItem(opt));
        return;
      }
      const header = document.createElement('li');
      header.className = 'group-label';
      header.textContent = opt.label;
      header.setAttribute('aria-hidden', 'true');
      list.appendChild(header);
      opt.items.map((i) => list.appendChild(this.#makeItem(i)));
    });
  }

  get isOpen() {
    return this.#list.matches(':popover-open');
  }

  get value() {
    return this.#currentValue;
  }

  set value(value) {
    this.setSelected(value, false);
    this.resolveInput();
  }

  set placeholder(value) {
    this.#placeholder = value;
    this.#input.placeholder = value;
  }

  resolveInput() {
    const input = this.#input;
    const text = input.value.trim().toLowerCase();
    const match = this.options.find((opt) => this.#getLabel(opt).toLowerCase() === text);
    if (match) {
      this.setSelected(match);
    } else {
      input.value = this.#getLabel(this.#currentValue) || '';
    }
  }

  setActive(index) {
    const items = this.#list.querySelectorAll('[data-value]:not(.hidden)');
    items.forEach((li) => li.classList.remove('over'));
    if (index < 0 || index >= items.length) {
      this.#active = -1;
      return;
    }
    this.#active = index;
    items[index].classList.add('over');
    this.scrollToActive();
  }

  scrollToActive() {
    this.#list.querySelector('.over')?.scrollIntoView({ block: 'nearest' });
  }

  setSelected(opt = '', emit = true) {
    if (this.#currentValue === opt) {
      if (emit) this.close();
      return;
    }
    if (!this.options.includes(opt)) {
      this.#currentValue = '';
      return;
    }
    this.#currentValue = opt;
    this.#input.value = this.#getLabel(opt);
    this.#list.querySelectorAll('[data-value]').forEach((e) => {
      const { value } = e.dataset;
      const selected = opt === value;
      e.setAttribute('aria-selected', selected ? 'true' : 'false');
      e.classList.toggle('selected', selected);
    });
    if (emit) {
      this.emit('change', opt);
      this.close();
    }
  }

  open() {
    if (this.isOpen) return;
    this.#button.textContent = 'keyboard_arrow_up';
    this.#list.showPopover({ source: this.#input });
    this.refresh(this.#filter(this.#input.value));
    const selected = this.#list.querySelector('.selected');
    if (selected) selected.scrollIntoView({ block: 'nearest' });
    else this.scrollToActive();
    this.emit('open');
  }

  close() {
    if (!this.isOpen) return;
    this.#button.textContent = 'keyboard_arrow_down';
    this.#list.hidePopover();
    this.emit('close');
  }

  refresh(list = this.#options) {
    this.setActive(-1);
    const labels = list.map((opt) => opt.items?.length && opt.label).filter(Boolean);
    this.#list.querySelectorAll('.group-label').forEach((el) => {
      el.classList.toggle('hidden', !labels.includes(el.textContent));
    });
    const items = list.flatMap((opt) => typeof opt === 'string' ? opt : opt.items);
    this.#list.querySelectorAll('[data-value]').forEach((e) => {
      e.classList.toggle('hidden', !items.includes(e.dataset.value));
    });
    this.#list.querySelector('li.empty').classList.toggle('hidden', items.length > 0);
  }

  #filter(text = '') {
    const query = text.trim().toLowerCase();
    const options = this.#options;
    if (!query) return options;
    const getLabel = this.#getLabel;
    return options.map((opt) => {
      if (typeof opt === 'string') return getLabel(opt).toLowerCase().includes(query) ? opt : null;
      const items = opt.items.filter((o) => getLabel(o).toLowerCase().includes(query));
      return items.length ? { label: opt.label, items } : null;
    }).filter(Boolean);
  }

  #makeItem(opt) {
    const li = document.createElement('li');
    li.dataset.value = opt;
    li.append(this.#renderer(opt, this.#getLabel(opt)));
    li.setAttribute('role', 'option');
    li.addEventListener('mousedown', (e) => {
      this.setSelected(opt);
    });
    return li;
  }

  /** @param {HTMLElement} container  */
  #initWrapper(container) {
    if (container.querySelector('.select-wrapper')) throw new Error('');
    const wrapper = document.importNode(template.content, true);
    const button = wrapper.querySelector('button');
    const input = wrapper.querySelector('input');
    const list = wrapper.querySelector('.select-list');

    input.addEventListener('keydown', (e) => {
      if (!this.isOpen) {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
          this.open();
        }
        return;
      }
      const items = list.querySelectorAll('[data-value]:not(.hidden)');
      const index = this.#active;
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          this.setActive(index + 1 >= items.length ? 0 : index + 1);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          this.setActive(index - 1 < 0 ? items.length - 1 : index - 1);
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (items[index]) this.setSelected(items[index].dataset.value);
          break;
        }
        case 'Escape':
          e.preventDefault();
          // fallthrough
        case 'Tab': {
          this.close();
          this.resolveInput();
          break;
        }
        default: return;
      }
    });
    input.addEventListener('input', () => {
      this.refresh(this.#filter(input.value));
      if (!this.isOpen) this.open();
    });
    input.addEventListener('focus', () => {
      if (this.isOpen) return;
      input.placeholder = input.value || this.#placeholder;
      input.value = '';
      this.open();
    });
    let suppressBlur = false;
    list.addEventListener('mousedown', (e) => {
      if (e.target.closest('[data-value]')) return;
      suppressBlur = true;
      requestAnimationFrame(() => {
        suppressBlur = false;
        input.focus();
      });
    });
    input.addEventListener('blur', (e) => {
      if (suppressBlur) return;
      setTimeout(() => {
        if (container.contains(document.activeElement)) return;
        this.close();
        this.resolveInput();
      }, 150);
    });


    button.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (this.isOpen) this.close();
      else {
        input.focus();
        this.open();
      }
    });

    this.#button = button;
    this.#input = input;
    this.#list = list;
    container.append(wrapper);
  }
}