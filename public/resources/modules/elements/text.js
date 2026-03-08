import BaseElement from './image.js';
import { Elements } from './types.js';

export default class Text extends BaseElement {
  constructor({
      ...rest
    } = {}) {
    super({
      ...rest,
      type: Elements.Text,
    });
  }
}
