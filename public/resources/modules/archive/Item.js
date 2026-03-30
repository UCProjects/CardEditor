/** @typedef {import('../elements/BaseElement.js').default} Element */

import EventEmitter from '../eventManager.js';

export default class Item extends EventEmitter {
  /** @type {Element} */
  element;
  /** @type {String | undefined} */
  group;
  trashed = false;

  constructor(el) {
    super();
    this.element = el;

    this.element
      .on('archived', () => this.emit('archived'))
      .on('delete', () => this.emit('trash'))
      .on('newGroup', (newGroup) => this.group = newGroup)
      .on('updated', () => this.emit('update'));
  }

  get id() {
    return this.element.id;
  }

  get name() {
    return this.element.name;
  }

  set name(name) {
    this.element.name = name;
  }

  get type() {
    return this.element.type;
  }

  isActive() {
    return this.element.renderer().container.isConnected;
  }

  isHidden() {
    return !!this.group || this.trashed || this.isActive();
  }
}
