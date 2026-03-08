import newRenderer from '../render/index.js';
import style from './style.css' with { type: 'css' };
import EventEmitter from '../eventManager.js';
import CardModule from './modules/card.js';
import TextModule from './modules/text.js';
import GroupModule from './modules/group.js';
import { sortedMatch } from '../utils/array.js';

document.adoptedStyleSheets.push(style);

/** @typedef {import('../render/base.js').default} Renderer */

/** @type {HTMLDialogElement} */
const editor = document.getElementById('editor');

function setActive(key) {
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

    editor.addEventListener('close', () => {
      const reason = editor.returnValue;
      const save = reason !== 'cancel';
      if (save) this.emit('save');

      this.emit('close', reason);
    });

    this.on('save', () => {
      const original = this.#original;
      const { element } = original;
      Object.entries(this.element.toJSON())
        .forEach(([k, v]) => {
          const val = element[k];
          const update = Array.isArray(v) ? sortedMatch(v, val) : val !== v;
          if (update) original.update(v, k);
        });
    });

    this.on('close', () => {
      this.#module[this.#renderer.element.type].unload();
      delete editor.dataset.editing;
      this.#renderer = null;
      this.#original = null;
    });
  }

  get container() {
    return this.#renderer.container;
  }

  get element() {
    return this.#renderer.element;
  }

  get isOpen() {
    return editor.open;
  }

  /** @param {Renderer} renderer */
  open(renderer) {
    this.#original = renderer;
    const element = renderer.element;

    setType(element.type);
    setActive('none');

    this.#renderer = newRenderer(element.clone());

    editor.querySelector('.preview').replaceChildren(this.container);

    editor.querySelectorAll('[data-editable]').forEach((el) => {
      const { editable, editableFor = editable } = el.dataset;
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        this.#prop = editableFor;

        setActive(editable);
      });
    });

    this.#module[element.type].init();

    editor.returnValue = undefined;
    editor.showModal();

    this.emit('open');
  }

  close(reason) {
    editor.close(reason);
  }

  update(value, key = this.#prop) {
    this.#renderer?.update(key, value);
  }
}

export default new Editor();
