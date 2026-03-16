import { uuidV4 } from '../3rdparty/uuid.js';
import EventEmitter from '../eventManager.js';
import CardRenderer from '../render/CardRenderer.js';
import GroupRenderer from '../render/GroupRenderer.js';
import TextRenderer from '../render/TextRenderer.js';
import { Elements } from './types.js';

/** @typedef {typeof import('./types.js').Elements} Elements */

export default class BaseElement extends EventEmitter {
  description;
  /** @type {string} */
  #id;
  name;
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

  /** @returns {import('../render/BaseRenderer.js').default} */
  renderer() {
    switch (this.type) {
      case Elements.Card: return new CardRenderer(this);
      case Elements.Group: return new GroupRenderer(this);
      case Elements.Text: return new TextRenderer(this);
      default: throw new Error(`Unknown element: ${this.id} [${this.type}]`);
    }
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
