import { Elements } from '../elements/types.js';
import { getURL, ImageType } from '../imageBank.js';
import Renderer from './BaseRenderer.js';

export default class ImageRenderer extends Renderer {
  /** @type {import('../elements/ImageElement.js').ImageElement} */
  get element() {
    return super.element;
  }

  image() {
    const type = this.element.type === Elements.Card ? ImageType.Avatar : ImageType.Artifact;
    const image = getURL(this.element.image, type) || '';
    this.container.querySelector('img.image, .image img').src = image;
  }

  /** @override */
  render() {
    super.render();
    this.image();
  }
}