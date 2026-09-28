import style from '../../styles/text.css' with { type: 'css' };
import { save as saveElement } from '../elements/registry.js';
import { TextSizes } from '../elements/types.js';
import { adoptStyle } from '../utils/funcs.js';
import Renderer from './ImageRenderer.js';

adoptStyle(style);

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

  #nextSize() {
    const { size = TextSizes.Normal } = this.element;
    const sizes = Number(getComputedStyle(this.container).getPropertyValue('--sizes')) || 3;
    if (sizes > 2 || size === TextSizes.Short) return NextSize[size];
    return TextSizes.Short;
  }

  /** @param {HTMLDivElement} menu  */
  bindMenu(menu) {
    super.bindMenu(menu);
    menu.querySelector('[data-tip="Resize"]').addEventListener('click', () => {
      this.element.emit('update', { size: this.#nextSize() });
      saveElement(this.element);
    });
  }
}
