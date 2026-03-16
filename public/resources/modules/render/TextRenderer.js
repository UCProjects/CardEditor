import style from '../../styles/text.css' with { type: 'css' };
import Renderer from './ImageRenderer.js';

document.adoptedStyleSheets.push(style);

export default class TextRenderer extends Renderer {
  /** @type {import('../elements/TextElement.js').default} */
  get element() {
    return super.element;
  }
}
