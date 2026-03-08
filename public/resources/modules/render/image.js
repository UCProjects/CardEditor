import Renderer from './base.js';

export default class ImageRenderer extends Renderer {
  /** @type {import('../elements/image.js').default} */
  get element() {
    return super.element;
  }

  image() {
    // TODO Get from imageBank
    this.container.querySelector('img.image, .image img').src = this.element.image;
  }

  /** @override */
  render() {
    super.render();
    this.image();
  }
}