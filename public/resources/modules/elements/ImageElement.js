import BaseElement from './BaseElement.js';

export default class ImageElement extends BaseElement {
  image;
  constructor({
    image = '',
    ...props
  }) {
    super(props);
    this.image = image;
  }
}
