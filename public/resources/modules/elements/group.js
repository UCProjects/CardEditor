import BaseElement from './base.js';
import { Elements } from './types.js';

export default class GroupElement extends BaseElement {
  /** @type {string[]} */
  content = [];

  constructor({
    content = [],
    ...rest
  } = {}) {
    super({
      name: 'Group',
      ...rest,
      type: Elements.Group,
    });
    this.content.push(...content);
  }
}
