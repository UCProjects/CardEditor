import EventEmitter from '../utils/EventEmitter.js';
import CardModule from './modules/CardModule.js';
import TextModule from './modules/TextModule.js';
import GroupModule from './modules/GroupModule.js';
import { loadStyle } from '../utils/funcs.js';
import settings, { Settings } from '../settings.js';

loadStyle('/resources/styles/editor.css');

/** @typedef {import('../render/BaseRenderer.js').default} Renderer */

/** @type {HTMLDialogElement} */
const editor = document.getElementById('editor');

/** @type {HTMLButtonElement} */
const swap = editor.querySelector('header > .swap');

swap.addEventListener('click', () => {
  editor.dataset.panel = editor.dataset.panel === 'helper' ? 'preview' : 'helper';
});

function syncViewport() {
  const { height, offsetTop } = window.visualViewport;
  editor.style.setProperty('--viewport-height', `${height}px`);
  editor.style.setProperty('--viewport-top', `${offsetTop}px`);
}

if (window.visualViewport) {
  ['resize', 'scroll'].forEach((type) => {
    window.visualViewport.addEventListener(type, () => {
      if (editor.open) syncViewport();
    });
  });
}

function setActive(key) {
  editor.dataset.panel = 'preview';
  if (key === 'none') {
    delete editor.dataset.editing;
  } else {
    editor.dataset.editing = key;
  }
  editor.querySelectorAll('[data-editing]').forEach(el => {
    el.classList.toggle('active', el.dataset.editing === key);
  });
}

function setType(type) {
  editor.dataset.type = type;
  editor.querySelectorAll('[data-type]').forEach(el => {
    el.classList.toggle('active', el.dataset.type === type);
  });
}

class Editor extends EventEmitter {
  /** @type {Renderer} */
  #original;
  /** @type {Renderer} */
  #renderer;
  #prop;

  #module = Object.freeze({
    card: new CardModule(this),
    group: new GroupModule(this),
    text: new TextModule(this),
  });

  constructor() {
    super();

    if (!('command' in HTMLButtonElement.prototype)) {
      editor.querySelectorAll('button[command="close"]').forEach((button) => {
        button.addEventListener('click', () => editor.close(button.value));
      });
    }

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      editor.addEventListener('click', (event) => {
        if (event.target !== editor) return;
        const { left, right, top, bottom } = editor.getBoundingClientRect();
        const { clientX: x, clientY: y } = event;
        if (x < left || x > right || y < top || y > bottom) editor.close();
      });
    }

    editor.addEventListener('close', () => {
      const reason = editor.returnValue;
      const save = settings.enabled(Settings.SaveOnClose) ? reason !== 'cancel' : reason === 'save';
      if (save) {
        this.emit('save'); // Allow listeners to make modifications
        this.#original.element.emit('update', this.element.toJSON());
        this.emit('saved');
      }

      this.emit('close', reason);
    });

    this.on('close', () => {
      this.#module[this.element.type].unload();
      delete editor.dataset.editing;
      this.#renderer.unload();
      this.#renderer = null;
      this.#original = null;
    });
  }

  get container() {
    return editor;
  }

  get element() {
    return this.#renderer.element;
  }

  get isOpen() {
    return editor.open;
  }

  /** @param {Renderer} renderer */
  open(renderer) {
    const element = renderer.element;
    const module = this.#module[element.type];

    setType(element.type);
    setActive('none');

    this.#original = renderer;
    this.#renderer = element.clone().renderer().asPreview();

    editor.querySelector('.preview').replaceChildren(this.#renderer.container);

    editor.querySelectorAll('[data-editable]').forEach((el) => {
      const { editable, editableFor = editable } = el.dataset;
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        this.#prop = editableFor;

        setActive(editable);
        module.emit('click', editableFor);
      });
    });

    module.init();
    this.emit('init');

    editor.returnValue = undefined;
    if (window.visualViewport) syncViewport();
    editor.showModal();

    this.#renderer.render();

    this.emit('open');
  }

  close(reason) {
    editor.close(reason);
  }

  update(value, key = this.#prop) {
    this.element.emit('update', { [key]: value });
  }
}

export default new Editor();
