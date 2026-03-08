import { uuidV4 } from '../3rdparty/uuid.js';
import EventEmitter from '../eventManager.js';

/** @typedef {typeof import('./types.js').default} Elements */

export default class BaseElement extends EventEmitter {
  name = '';
  #id;
  description = '';
  /** @type {Elements[keyof Elements]} */
  #type;

  constructor({
    id = uuidV4(),
    type,
    ...props
  }) {
    if (!type) throw new Error('Element requires type');
    super();
    this.#id = id;
    this.#type = type;
    Object.assign(this, props);
  }

  get id() {
    return this.#id;
  }

  get type() {
    return this.#type;
  }

  getElement(id = `template#${this.type}`) {
    const template = document.querySelector(id);
    if (!template) throw new Error(`Failed to find template '${id}'`);
    const container = document.createElement('div');
    container.id = `${this.type}-${this.id}`;
    container.innerHTML = template.innerHTML;
    container.classList.add('element', this.type);
    return container;
  }

  clone() {
    return new this.constructor(this.toJSON());
  }

  toJSON() {
    const {
      id,
      type,
    } = this;
    const ret = {
      ...this,
      // TODO: ...getProps(this).reduce((acc, key) => acc[key] = this[key], {}),
      id,
      type,
    };
    Object.entries(ret).forEach(([key, value]) => {
      if (Array.isArray(value)) { // Clone arrays
        ret[key] = [...value];
      }
    });
    return ret;
  }
}
