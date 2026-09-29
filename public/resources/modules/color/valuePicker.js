import { getHex } from '../utils/color.js';
import Picker from './picker.js';

export default class ValuePicker extends Picker {
  /** @type {HTMLElement} */
  #trigger;
  #value = '';

  constructor(trigger) {
    super();
    if (!(trigger instanceof HTMLElement)) throw new Error('Must provide an element');

    this.#trigger = trigger;
  }

  get source() {
    return this.#trigger;
  }

  get value() {
    return this.#value;
  }

  isSource(target) {
    return this.#trigger.contains(target);
  }

  read(hex) {
    return getHex(hex ?? this.#value);
  }

  write(color = '') {
    this.#value = color;
    this.emit('change', color && `#${color}`);
  }
}
