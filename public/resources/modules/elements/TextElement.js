import BaseElement from './ImageElement.js';
import { Elements } from './types.js';

export const TextSizes = Object.freeze({
  Normal: '',
  Stretch: 'stretch',
  Short: 'short',
});

export default class TextElement extends BaseElement {
  /** @type {TextSizes[keyof TextSizes]} */
  #size;

  constructor({
      size,
      ...rest
    } = {}) {
    super({
      name: 'Artifact',
      ...rest,
      type: Elements.Text,
    });
    this.size = size;
  }

  get size() {
    return this.#size || undefined;
  }

  set size(size = '') {
    if (!Object.values(TextSizes).includes(size)) return;
    this.#size = size;
  }

  toJSON() {
    const { size } = this;
    return {
      ...super.toJSON(),
      size,
    };
  }
}
