import { v4 } from 'https://ga.jspm.io/npm:uuid@9.0.0';

export default class Base {
  #id;
  #type;

  constructor({
    id = v4(),
    type,
  }) {
    if (!type) throw new Error('Element requires type');
    this.#id = id;
    this.#type = type;
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
    container.id = this.id;
    container.innerHTML = template.innerHTML;
    container.classList.add('element', this.type);
    return container;
  }

  toJSON() {
    const {
      id,
      type,
    } = this;
    return {
      id,
      type,
    };
  }
}