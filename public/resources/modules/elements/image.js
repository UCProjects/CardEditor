import BaseElement from './base.js';

export default class Image extends BaseElement {
  image;
  constructor({
    image = '',
    ...props
  }) {
    super(props);
    this.image = image;
  }
}
