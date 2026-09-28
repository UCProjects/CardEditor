import TextRenderer from '../render/TextRenderer.js';
import BaseElement from './ImageElement.js';
import { Elements, TextSizes } from './types.js';

export default class TextElement extends BaseElement {
  rarity;
  /** @type {TextSizes[keyof TextSizes]} */
  #size;

  constructor({
      rarity = '',
      size,
      ...rest
    } = {}) {
    super({
      name: 'Artifact',
      ...rest,
      type: Elements.Text,
    });
    this.rarity = rarity;
    this.size = size;
  }

  get size() {
    return this.#size || undefined;
  }

  set size(size = '') {
    if (!Object.values(TextSizes).includes(size)) return;
    this.#size = size;
  }

  newRenderer() {
    return new TextRenderer(this);
  }

  toJSON() {
    const { size } = this;
    return {
      ...super.toJSON(),
      size,
    };
  }
}
