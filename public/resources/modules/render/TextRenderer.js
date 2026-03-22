import style from '../../styles/text.css' with { type: 'css' };
import { save as saveElement } from '../elements/registry.js';
import { TextSizes } from '../elements/types.js';
import Renderer from './ImageRenderer.js';

document.adoptedStyleSheets.push(style);

const NextSize = {
  [TextSizes.Normal]: TextSizes.Stretch,
  [TextSizes.Stretch]: TextSizes.Short,
  [TextSizes.Short]: TextSizes.Normal,
};

export default class TextRenderer extends Renderer {
  /** @type {import('../elements/TextElement.js').default} */
  get element() {
    return super.element;
  }

  resize() {
    const classes = this.container.classList;
    classes.remove(TextSizes.Short, TextSizes.Stretch);
    const { size } = this.element;
    if (size) classes.add(size);
  }

  size() {
    this.resize();
  }

  render() {
    super.render();
    this.resize();
  }

  /** @param {HTMLDivElement} menu  */
  bindMenu(menu) {
    super.bindMenu(menu);
    menu.querySelector('[data-tip="Resize"]').addEventListener('click', () => {
      const { size = TextSizes.Normal } = this.element;
      this.update('size', NextSize[size]);
      saveElement(this.element.id);
    });
  }
}
