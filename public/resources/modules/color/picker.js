import style from '../../styles/picker.css' with { type: 'css' };
import { adoptStyle } from '../utils/funcs.js';
import { isFullHex, isHashHex } from '../utils/color.js';
import { getColors, setColors } from '../utils/storage.js';
import EventEmitter from '../utils/EventEmitter.js';

adoptStyle(style);

/** @param {InputEvent} e  */
export function hexInputListener(e) {
  const raw = e.data || e.dataTransfer?.getData('text');
  if (raw == null) return;
  const el = e.target;
  const data = raw.replace(/^#/, '');
  const next = el.value.slice(0, el.selectionStart) + data + el.value.slice(el.selectionEnd);
  if (!/^[0-9a-fA-F]{0,6}$/.test(next)) {
    e.preventDefault();
    return;
  }
  if (data === raw) return;
  e.preventDefault();
  el.setRangeText(data, el.selectionStart, el.selectionEnd, 'end');
  el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

export const PRESETS = [
  '#e63946','#f4a261','#ffd166','#06d6a0','#4ff76b',
  '#118ab2','#9b5de5','#ff99c8','#c9ada7','#adb5bd',
];

/** @type {HTMLDivElement} */
const picker = document.getElementById('picker');
const fill = picker.querySelector('.picker-preview-fill');
const native = picker.querySelector('.picker-native');
const input = picker.querySelector('.picker-input');
const recent = picker.querySelector('.picker-recent');
const confirm = picker.querySelector('.confirm');
const cancel = picker.querySelector('.cancel');

/** Last = most recent */
const swatches = getColors();

function swatch(color = '') {
  const hex = color.substring(1);
  const el = recent.querySelector(`[data-hex="${hex}"]`);
  if (el) return el;
  const button = document.createElement('button');
  button.className = 'swatch';
  button.dataset.hex = hex;
  button.style.background = color;
  button.title = color;
  return button;
}

function addSwatch(color, insert = false) {
  if (color.length < 6) return {};
  const colorHash = color.startsWith('#') ? color : `#${color}`;
  if (insert) {
    const index = swatches.indexOf(colorHash);
    if (~index) {
      swatches.splice(index, 1);
    }
    swatches.push(colorHash);
    if (swatches.length > 16) {
      swatches.splice(0, swatches.length - 16);
    }
    setColors(swatches);
  }
  const button = swatch(colorHash);
  const isNew = !recent.contains(button);
  recent.prepend(button);
  return { isNew, button };
}

function buildSwatches(presets = PRESETS) {
  recent.innerHTML = '';
  for (let i = 0, count = 16 - swatches.length; i < presets.length && count > 0; i++) {
    const color = presets[i];
    if (swatches.includes(color)) continue;
    addSwatch(color);
    count -= 1;
  }
  swatches.forEach((color) => addSwatch(color));
}

export const PICKER_WIDTH = 224;
export const PICKER_GAP = 8;

export default class Picker extends EventEmitter {
  #controller = new AbortController();

  #original = '';
  #current;
  #presets;

  constructor({ presets = PRESETS } = {}) {
    super();
    this.#presets = presets;
  }

  get presets() {
    return this.#presets;
  }

  get isOpen() {
    return picker.matches(':popover-open');
  }

  get recent() {
    return recent.querySelector('[data-hex]').dataset.hex;
  }

  get current() {
    return this.#current;
  }

  get original() {
    return this.#original;
  }

  get signal() {
    return this.#controller.signal;
  }

  /**
   * The element the popover anchors to and returns focus to.
   * @returns {HTMLElement}
   */
  get source() {
    return document.body;
  }

  /** @returns {string} the hex the picker should open on, without a leading # */
  read() {
    return '';
  }

  /** Deliver the chosen colour to whatever this picker targets. */
  write() {}

  /** Runs when the picker closes without committing. */
  cleanup() {}

  /** Runs after the popover hides, to drop any per-session state. */
  reset() {}

  canCommit() {
    return true;
  }

  isSource(target) {
    return target === this.source;
  }

  open({ hex = null, focus = true } = {}) {
    if (this.isOpen) return;

    const container = this.source.closest('dialog') || document.body;
    if (!container.contains(picker)) container.append(picker);

    buildSwatches(this.#presets);

    const editing = !!hex;
    this.#original = this.read(hex) || '';
    this.setPosition();
    this.apply(this.#original || this.recent, !editing, focus);
    if (focus) setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
    this.#events();
  }

  close(commit = true) {
    if (!this.isOpen) return;

    if (commit && isFullHex(this.#current)) {
      addSwatch(this.#current, true);
      this.commit(this.#current);
    } else {
      this.commit(this.#original);
      this.cleanup();
    }

    picker.hidePopover();

    this.#original = null;
    this.reset();

    this.#controller.abort();
    this.#controller = new AbortController();

    this.source.focus();
  }

  apply(color, commit = true, move = true) {
    if (color.length !== 6) return;
    input.value = color.toUpperCase();
    const current = color.toLowerCase();
    const full = `#${current}`;
    fill.style.background = full;
    native.value = full;
    confirm.style.color = full;
    this.#current = current;
    if (commit) this.commit(color, move);
  }

  commit(color = '', ...rest) {
    if (!this.canCommit()) return;
    this.write(color, ...rest);
    const { isNew, button } = addSwatch(color);
    if (isNew) this.initButton(button);
    this.emit('updated');
  }

  setPosition() {
    const { left } = this.source.getBoundingClientRect();
    const x = Math.min(left, window.innerWidth - PICKER_WIDTH);
    picker.style.left = Math.max(x, PICKER_GAP) + 'px';
    picker.showPopover({ source: this.source });
  }

  setLeft(x) {
    picker.style.left = Math.max(x, PICKER_GAP) + 'px';
    picker.showPopover({ source: this.source });
  }

  /** @param {HTMLButtonElement} button */
  initButton(button) {
    const { signal } = this.#controller;
    const { hex } = button.dataset;
    button.addEventListener('click', () => this.apply(hex, true), { signal });
  }

  #events() {
    const opts = { signal: this.#controller.signal };
    confirm.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.close(true);
    }, opts);
    cancel.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.close(false);
    }, opts);
    picker.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.close(true);
      }
    }, opts);
    recent.querySelectorAll('button').forEach((el) => this.initButton(el));
    native.addEventListener('change', () => {
      const v = native.value;
      if (isHashHex(v)) this.apply(v.substring(1), true);
    }, opts);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        this.close(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.close(false);
      }
    }, opts);
    input.addEventListener('beforeinput', hexInputListener, opts);
    input.addEventListener('input', () => {
      const color = input.value.toUpperCase();
      if (isFullHex(color)) this.apply(color, true);
      else this.commit(color);
    }, opts);
    document.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || !this.isOpen || this.isSource(e.target) || picker.contains(e.target)) return;
      this.close(true);
    }, opts);
  }
}
