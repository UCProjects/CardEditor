import { getURL } from '../imageBank.js';
import Renderer from './BaseRenderer.js';

export default class ImageRenderer extends Renderer {
  /** @type {import('../elements/ImageElement.js').ImageElement} */
  get element() {
    return super.element;
  }

  image() {
    // TODO Get from imageBank
    const image = getURL(this.element.image) || '';
    this.container.querySelector('img.image, .image img').src = image;
  }

  /** @override */
  render() {
    super.render();
    this.image();
  }
}