import getCoordinates from 'https://ga.jspm.io/npm:textarea-caret@3.1.0/index.js';
import { getHex } from '../utils/color.js';
import Picker, { PICKER_WIDTH } from './picker.js';

export default class TextPicker extends Picker {
  #position = -1;

  /** @type {HTMLTextAreaElement | HTMLInputElement} */
  #editor;

  constructor(element) {
    super();
    if (!['TEXTAREA', 'INPUT'].includes(element?.nodeName)) throw new Error('Must provide TextArea or Input');

    this.#editor = element;
  }

  get position() {
    return this.#position;
  }

  get source() {
    return this.#editor;
  }

  open({
    pos = this.#editor.selectionStart,
    hex = null,
    focus = true,
  } = {}) {
    if (this.isOpen) return;

    this.#position = pos;
    super.open({ hex, focus });
  }

  read(hex) {
    return getHex(hex || this.#editor.value.substring(this.#position));
  }

  canCommit() {
    return this.#position >= 0;
  }

  reset() {
    this.#position = -1;
  }

  write(color = '', move = this.#position === this.#editor.selectionStart) {
    const pos = this.#position;
    const text = this.#editor.value;
    const isHash = text[pos] === '#';
    const tail = text.substring(pos + isHash);
    const [written = ''] = tail.match(/^[^|]*/) || [];
    const hasColor = !!color;
    const isNotPipe = hasColor && tail[written.length] !== '|';
    this.#editor.value = `${text.substring(0, pos)}${hasColor ? '#' : ''}${color}${isNotPipe ? '|}' : ''}${tail.substring(written.length)}`;
    const end = pos + color.length + (hasColor && isHash) + isNotPipe;
    if (move || (this.#editor.selectionStart >= pos && this.#editor.selectionStart < end)) {
      this.#editor.setSelectionRange(end, end);
    }
  }

  cleanup() {
    const pos = this.#position;
    if (pos < 1) return;
    const text = this.#editor.value;
    if (text[pos - 1] !== '{') return;
    const close = text.indexOf('}', pos);
    if (!~close || text.substring(pos, close) !== '|') return;
    this.#editor.value = text.substring(0, pos - 1) + text.substring(close + 1);
    this.#editor.setSelectionRange(pos - 1, pos - 1);
    this.emit('updated');
  }

  setPosition() {
    const { left } = this.#editor.getBoundingClientRect();
    /** @type {{ top: number; left: number; height: number; }} */
    let { left: x } = getCoordinates(this.#editor, this.#position);
    if (x + left + PICKER_WIDTH > window.innerWidth) x = window.innerWidth - PICKER_WIDTH;
    else x += left;
    this.setLeft(x);
  }
}
