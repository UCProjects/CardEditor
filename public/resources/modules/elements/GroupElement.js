import GroupRenderer from '../render/GroupRenderer.js';
import BaseElement from './BaseElement.js';
import { get, register, save } from './registry.js';
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

  /** @returns {this} */
  duplicate() {
    const copy = super.duplicate();
    copy.content.length = 0;
    this.content.forEach((childId) => {
      const child = get(childId)?.duplicate();
      if (!child) return;
      register(child);
      save(child);
      copy.content.push(child.id);
    });
    return copy;
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
