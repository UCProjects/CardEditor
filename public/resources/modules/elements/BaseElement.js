import { uuidV4 } from '../3rdparty/uuid.js';
import EventEmitter from '../eventManager.js';

/** @typedef {typeof import('./types.js').Elements} Elements */

export default class BaseElement extends EventEmitter {
  description;
  /** @type {string} */
  #id;
  name;
  /** @type {import('../render/BaseRenderer.js').default} */
  #renderer;
  /** @type {Elements[keyof Elements]} */
  #type;

  constructor({
    description = '',
    id = uuidV4(),
    name = '',
    type,
  }) {
    if (!type) throw new Error('Element requires type');
    super();
    this.description = description;
    this.#id = id;
    this.name = name;
    this.#type = type;
  }

  get id() {
    return this.#id;
  }

  get type() {
    return this.#type;
  }

  /** @returns {this} */
  clone() {
    const Element = Reflect.getPrototypeOf(this).constructor;
    return new Element(this.toJSON());
  }

  renderer() {
    this.#renderer ||= this.newRenderer();
    return this.#renderer;
  }

  newRenderer() {
    throw new Error('Must be overridden');
  }

  toJSON() {
    const {
      id,
      type,
    } = this;
    return {
      ...this,
      // TODO: ...getProps(this).reduce((acc, key) => acc[key] = this[key], {}),
      id,
      type,
    };
  }
}
