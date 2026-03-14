import style from './text.css' with { type: 'css' };
import Renderer from './image.js';

document.adoptedStyleSheets.push(style);

export default class TextRenderer extends Renderer {
  /** @type {import('../elements/text.js').default} */
  get element() {
    return super.element;
  }
}
