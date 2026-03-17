import editor from '../editor/editor.js';
import { Elements } from '../elements/types.js';
import EventEmitter from '../eventManager.js';
import { getHTMLDescription } from './util.js';
import style from '../../styles/menu.css' with { type: 'css' };
import { sortedMatch } from '../utils/array.js';
import saveImage from '../save.js';
import { register, save } from '../elements/registry.js';

document.adoptedStyleSheets.push(style);

const menuTemplate = document.querySelector('template#menu');

/**
 * @param {Renderer} renderer
 * @param {HTMLDivElement} menu
 */
function bindMenu(renderer, menu) {
  const { type } = renderer.element;
  if (type === Elements.Card) {
    const card = renderer.container;
    card.addEventListener('mouseenter', () => {
      menu.showPopover({ source: card });
    });
  } else {
    renderer.query('header').addEventListener('mouseenter', (e) => {
      menu.showPopover({ source: e.target });
    });
  }

  menu.querySelectorAll('[data-type]').forEach((el) => {
    if (el.dataset.type !== type) el.remove();
  });

  if (type === Elements.Group) {
    menu.querySelector(`[data-tip="Group"]`).addEventListener('click', () => {
      renderer.emit(Elements.Group);
    });
  }

  // Edit button
  menu.querySelector('[data-tip="Edit"]').addEventListener('click', () => {
    editor.open(renderer);
  });

  // Save
  menu.querySelector('[data-tip="Download"]').addEventListener('click', () => {
    saveImage(renderer.container, renderer.element.name || type);
  });

  // Delete
  menu.querySelector('[data-tip="Archive"]').addEventListener('click', () => renderer.emit('archive'));
}

export default class BaseRenderer extends EventEmitter {
  #container;
  /** @type {import('../elements/BaseElement.js').default} */
  #element;

  /** @param {import('../elements/BaseElement.js').default} element  */
  constructor(element) {
    super();
    this.#element = element;
    this.#container = this.getElement();
    this.render();

    this.on('update', (data) => {
      const modified = Object.entries(data).reduce((updated, [k, v]) => {
        const val = element[k];
        // TODO This should use `match`
        const update = Array.isArray(v) ? !sortedMatch(v, val) : val !== v;
        if (update) this.update(k, v);
        return updated || update;
      }, false);
      if (modified) {
        this.emit('save');
      }
    });

    this.on('save', () => {
      register(element);
      save(element.id);
    });
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
    const container = this.query('.description div') || this.query('.description');
    container.innerHTML = getHTMLDescription(this.element.description);
  }

  name() {
    this.query('.name').textContent = this.element.name;
  }

  render() {
    this.description();
    this.name();
  }

  unload() {
    this.container.remove();
  }

  addMenu() {
    const menu = this.query('.menu');
    if (menu) return menu; // Exists
    // Create menu
    this.container.insertAdjacentHTML('beforeend', menuTemplate.innerHTML);
    const container = this.query('.menu');
    bindMenu(this, container);
    return container;
  }

  update(key, value) {
    if (!key) throw new Error('Updating without key');
    this.element[key] = value;
    this[key]?.();
  }

  getElement(id = `template#${this.element.type}`) {
    const { element } = this;
    const template = document.querySelector(id);
    if (!template) throw new Error(`Failed to find template '${id}'`);
    const container = document.createElement('div');
    container.id = `${element.type}-${element.id}`;
    container.innerHTML = template.innerHTML;
    container.classList.add('element', element.type);
    return container;
  }
}
