import style from '../../styles/group.css' with { type: 'css' };
import Renderer from './BaseRenderer.js';
import { events, get, init } from '../elements/registry.js';
import { Elements } from '../elements/types.js';
import editor from '../editor/editor.js';
import { tryOrErrorSync } from '../toast/index.js';
import { adoptStyle } from '../utils/funcs.js';

adoptStyle(style);

const buttonHTML = document.querySelector('#groupButtons').innerHTML;

/** @type {WeakMap<Renderer, AbortController>} */
const elementBindings = new WeakMap();

export default class GroupRenderer extends Renderer {
  #deleteController = new AbortController();

  /** @type {import('../elements/GroupElement.js').default} */
  get element() {
    return super.element;
  }

  /** Must be manually called */
  content() {
    if (this.query('.buttons')) return;
    this.addMenu();
    this.addButtons();
    this.#addGroupEvents();
    const elements = this.element.content.map((id) => tryOrErrorSync(
      () => {
        const render = get(id).renderer();
        this.#addElementEvents(render);
        this.one('loaded', () => render.render());
        return render.container;
      },
      `Failed to load ${id}`,
    )).filter(_ => _);
    this.query('.buttons').before(...elements);
    return this.container;
  }

  /** @param {import('./BaseRenderer.js').default} render */
  adopt(render) {
    this.#addElementEvents(render);
  }

  addButtons() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('buttons', 'no-save');
    wrapper.innerHTML = buttonHTML;
    this.query('.content').append(wrapper);
  }

  /** @param {HTMLDivElement} menu  */
  bindMenu(menu) {
    super.bindMenu(menu);
    menu.querySelector('[data-tip="Group"]').addEventListener('click', () => {
      this.emit(Elements.Group);
    });
  }

  /** @param {import('../elements/BaseElement.js').default} element */
  #newElement(element, edit = true) {
    const { content } = this.element;
    content.push(element.id);

    const render = element.renderer();
    this.#addElementEvents(render);
    this.query('.buttons').before(render.container);

    if (!edit) return;
    events.emit('add', element);

    const editController = new AbortController();
    editor.on('save', () => {
      editController.abort();
      this.emit('save');
    }, { signal: editController.signal });
    editor.on('close', () => {
      editController.abort();
      render.emit('archived', true);
    }, { signal: editController.signal });

    editor.open(render);
  }

  /** @param {import('./BaseRenderer.js').default} render */
  #addElementEvents(render) {
    render.addMenu();
    elementBindings.get(render)?.abort();
    const archivedController = new AbortController();
    elementBindings.set(render, archivedController);

    render.on('duplicate', () => {
      const { content } = this.element;
      const index = content.indexOf(render.element.id);
      if (!~index) return;
      const copy = render.element.duplicate();
      content.splice(index + 1, 0, copy.id);
      const copyRender = copy.renderer();
      this.#addElementEvents(copyRender);
      render.container.after(copyRender.container);
      copyRender.render();
      copyRender.emit('save');
    }, { signal: archivedController.signal });
    render.one('save', () => this.emit('save'), { signal: archivedController.signal });

    render.on('archive', (trash = false) => render.emit('archived', trash), { signal: archivedController.signal });
    render.on('archived', (trash = false) => {
      const { id } = render.element;
      const index = this.element.content.indexOf(id);
      if (!~index) return;
      this.element.content.splice(index, 1);
      render.unload();
      render.element.emit(get(id) && !trash ? 'archived' : 'delete');
      this.emit('save');
      archivedController.abort();
    }, { signal: archivedController.signal });
  }

  #addGroupEvents() {
    this.on(Elements.Card, (monster = false) => {
      const card = init({ type: Elements.Card });
      if (monster) card.setMonster();
      this.#newElement(card);
    });
    this.on(Elements.Text, () => this.#newElement(init({ type: Elements.Text })));
    this.on('archived', (trash = false) => {
      this.unload();
      this.element.emit(get(this.element.id) && !trash ? 'archived' : 'delete');
      this.#deleteController.abort();
    });
    this.on('drop', (element) => this.#newElement(element, false));

    this.query('.buttons button.monster').addEventListener('click', () => this.emit(Elements.Card, true));
    this.query('.buttons button.spell').addEventListener('click', () => this.emit(Elements.Card));
    this.query('.buttons button.text').addEventListener('click', () => this.emit(Elements.Text));
  }
}
