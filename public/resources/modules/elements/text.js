import BaseElement from './image.js';
import { Elements } from './types.js';

export default class TextElement extends BaseElement {
  constructor({
      ...rest
    } = {}) {
    super({
      name: 'Artifact',
      ...rest,
      type: Elements.Text,
    });
  }
}
