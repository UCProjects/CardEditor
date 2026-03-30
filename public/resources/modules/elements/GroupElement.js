import GroupRenderer from '../render/GroupRenderer.js';
import BaseElement from './BaseElement.js';
import { get } from './registry.js';
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

  newRenderer() {
    return new GroupRenderer(this);
  }

  remove(id) {
    const { content } = this;
    const index = content.indexOf(id);
    if (index === -1) return;
    content.splice(index, 1);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      content: this.content.filter(get),
    };
  }
}
