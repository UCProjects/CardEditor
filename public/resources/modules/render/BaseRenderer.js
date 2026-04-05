import editor from '../editor/editor.js';
import { Elements } from '../elements/types.js';
import EventEmitter from '../utils/EventEmitter.js';
import { getHTMLDescription } from './util.js';
import style from '../../styles/menu.css' with { type: 'css' };
import style2 from '../../styles/description.css' with { type: 'css' };
import saveImage from '../save.js';
import { register, save } from '../elements/registry.js';
import { isOpen as isArchiveOpen } from '../archive/index.js';
import { adoptStyle } from '../utils/funcs.js';

/** @typedef {import('../elements/BaseElement.js').default} BaseElement */

adoptStyle(style, style2);

const menuHTML = document.querySelector('template#menu').innerHTML;

/**
 * @param {BaseRenderer} renderer
 * @param {HTMLDivElement} menu
 */
function bindMenu(renderer, menu) {
  const { type } = renderer.element;

  menu.addEventListener('toggle', (e) => {
    if (e.newState === 'closed') return;

    const controller = new AbortController();
    const { signal } = controller;

    document.addEventListener('keydown', (event) => {
      if (menu.classList.contains('shift')) return;
      if (event.key === 'Shift') menu.classList.add('shift');
    }, { signal });
    document.addEventListener('keyup', (event) => {
      if (event.key === 'Shift') menu.classList.remove('shift');
    }, { signal });

    menu.addEventListener('toggle', () => controller.abort(), { once: true });
  });

  // Open menu
  const source = type === Elements.Group ? renderer.query('header') : renderer.container;
  source.addEventListener('mouseenter', (e) => {
    if (isArchiveOpen()) return;
    menu.classList.toggle('shift', e.shiftKey);
    menu.showPopover({ source });
  });

  // Remove mismatched buttons
  menu.querySelectorAll('[data-type]').forEach((el) => {
    if (!el.dataset.type.split(',').includes(type)) el.remove();
  });

  // Edit button
  menu.querySelector('[data-tip="Edit"]').addEventListener('click', () => {
    editor.open(renderer);
  });

  // Save
  menu.querySelector('[data-tip="Download"]').addEventListener('click', () => {
    saveImage(renderer.container, renderer.element.name || type);
  });

  // Archive
  menu.querySelector('[data-tip="Archive"]').addEventListener('click', () => renderer.emit('archive'));

  // Trash
  menu.querySelector('[data-tip="Trash"]').addEventListener('click', () => renderer.emit('archive', true));
}

export default class BaseRenderer extends EventEmitter {
  #container;
  /** @type {BaseElement} */
  #element;

  /** @param {BaseElement} element  */
  constructor(element) {
    super();
    this.#element = element;
    this.#container = this.getElement();
    this.render();

    this.element.on('updated', (keys) => {
      keys.forEach((key) => this[key]?.());
      this.emit('save');
    });

    this.on('save', () => {
      register(element);
      save(element);
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
    const el = this.query('.description');
    const container = el.querySelector('div') || el;
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
    this.container.insertAdjacentHTML('beforeend', menuHTML);
    const container = this.query('.menu');
    this.bindMenu(container);
    return container;
  }

  bindMenu(menu) {
    bindMenu(this, menu);
  }

  /** @param {BaseElement} element */
  update(element) {
    this.element.emit('update', element.toJSON());
  }

  getElement(id = `template#${this.element.type}`) {
    const { element } = this;
    const template = document.querySelector(id);
    if (!template) throw new Error(`Failed to find template '${id}'`);
    const container = document.createElement('div');
    container.innerHTML = template.innerHTML;
    container.classList.add('element', element.type);
    container.dataset.id = element.id;
    return container;
  }
}
