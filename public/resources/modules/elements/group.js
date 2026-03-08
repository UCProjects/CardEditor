import BaseElement from './base.js';
import { Elements } from './types.js';

export default class Group extends BaseElement {
  /** @type {string[]} */
  content = [];

  constructor({
    ...rest
  } = {}) {
    super({
      ...rest,
      type: Elements.Group,
    });
  }

  /* toJSON() {
    const {} = this;
    return {
      ...super.toJSON(),
    };
  } */
}
