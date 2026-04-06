import getCoordinates from 'https://ga.jspm.io/npm:textarea-caret@3.1.0/index.js';
import style from '../../styles/picker.css' with { type: 'css' };
import { adoptStyle } from '../utils/funcs.js';
import { getHex, isFullHex, isHashHex } from '../utils/color.js';
import { getColors, setColors } from '../utils/storage.js';
import EventEmitter from '../utils/EventEmitter.js';

adoptStyle(style);

/** @param {InputEvent} e  */
function hexInputListener(e) {
  if (e.inputType !== 'insertText') return;
  if (!/^[0-9a-fA-F]{0,6}$/.test(e.data)) e.preventDefault();
}

const PRESETS = [
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

function buildSwatches() {
  recent.innerHTML = '';
  for (let i = 0, count = 10 - swatches.length; i < PRESETS.length && count > 0; i++) {
    const color = PRESETS[i];
    if (swatches.includes(color)) continue;
    addSwatch(color);
    count -= 1;
  }
  swatches.forEach((color) => addSwatch(color));
}

export default class Picker extends EventEmitter {
  #controller = new AbortController();

  #original = '';
  #current;
  #position = -1;

  /** @type {HTMLTextAreaElement | HTMLInputElement} */
  #editor;

  constructor(element) {
    super();
    if (!['TEXTAREA', 'INPUT'].includes(element?.nodeName)) throw new Error('Must provide TextArea or Input');

    this.#editor = element;
  }

  get isOpen() {
    return picker.matches(':popover-open');
  }

  get recent() {
    return recent.querySelector('[data-hex]').dataset.hex;
  }

  open({
    pos = this.#editor.selectionStart,
    hex = null,
    focus = true,
  } = {}) {
    if (this.isOpen) return;

    const container = this.#editor.closest('dialog') || document.body;
    if (!container.contains(picker)) container.append(picker);

    buildSwatches();

    const editing = !!hex;
    this.#original = getHex(hex || this.#editor.value.substring(pos)) || '';
    this.#position = pos;
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
    }

    picker.hidePopover();

    this.#original = null;
    this.#position = -1;

    this.#controller.abort();
    this.#controller = new AbortController();
  }

  apply(color, commit = true, focus = true) {
    if (color.length !== 6) return;
    input.value = color.toUpperCase();
    const current = color.toLowerCase();
    const full = `#${current}`;
    fill.style.background = full;
    native.value = full;
    confirm.style.color = full;
    this.#current = current;
    if (commit) this.commit(color, focus);
  }

  commit(color = '', focus = true) {
    if (this.#position < 0) return;
    const pos = this.#position;
    const text = this.#editor.value;
    const isHash = text[pos] === '#';
    const tail = text.substring(pos + isHash);
    const [written = ''] = tail.match(/^[^|]*/) || [];
    this.#editor.value = `${text.substring(0, pos)}${color ? '#' : ''}${color}${tail.substring(written.length)}`;
    const { isNew, button } = addSwatch(color);
    if (isNew) this.#initButton(button);
    if (focus) {
      const end = pos + color.length + (color !== '' && isHash);
      this.#editor.setSelectionRange(end, end);
    }
    this.emit('updated');
  }

  setPosition() {
    const GAP = 8;
    const width = 224;
    const index = this.#position;
    const { left } = this.#editor.getBoundingClientRect();
    /** @type {{ top: number; left: number; height: number; }} */
    let { left: x } = getCoordinates(this.#editor, index);
    if (x + left + width > window.innerWidth) x = window.innerWidth - width;
    else x += left;
    picker.style.left = Math.max(x, GAP) + 'px';
    picker.showPopover({ source: this.#editor });
  }

  /** @param {HTMLButtonElement} button */
  #initButton(button) {
    const { signal } = this.#controller;
    const { hex } = button.dataset;
    button.addEventListener('click', () => this.apply(hex, true), { signal });
  }

  #events() {
    const opts = { signal: this.#controller.signal };
    confirm.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.close();
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
    recent.querySelectorAll('button').forEach((el) => this.#initButton(el));
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
      if (!this.isOpen || e.target === this.#editor || picker.contains(e.target)) return;
      this.close(true);
    }, opts);
  }
}
