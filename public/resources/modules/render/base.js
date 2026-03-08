import { getHTMLDescription } from './util.js';

export default class Renderer {
  #container;
  /** @type {import('../elements/base.js').default} */
  #element;

  constructor(element) {
    this.#element = element;
    this.#container = this.#element.getElement();
    this.render();
  }

  get container() {
    return this.#container;
  }

  get element() {
    return this.#element;
  }

  query(selector) {
    return this.#container.querySelector(selector);
  }

  queryAll(selector) {
    return this.#container.querySelectorAll(selector);
  }

  description() {
    this.query('.description').innerHTML = getHTMLDescription(this.element.description);
  }

  name() {
    this.query('.name').textContent = this.element.name;
  }

  render() {
    this.description();
    this.name();
  }

  update(key, value) {
    if (!key) throw new Error('Updating without key');
    this.element[key] = value;
    this[key]?.();
  }
}
