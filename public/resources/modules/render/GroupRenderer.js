import style from '../../styles/group.css' with { type: 'css' };
import Renderer from './BaseRenderer.js';
import { get, init, register, save } from '../elements/registry.js';
import { Elements } from '../elements/types.js';
import editor from '../editor/editor.js';
import { tryOrErrorSync } from '../toast/index.js';

document.adoptedStyleSheets.push(style);

const buttonTemplate = document.querySelector('#groupButtons');

// TODO how to support "sorting/dragging"
export default class GroupRenderer extends Renderer {
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
        return render.container;
      },
      `Failed to load ${id}`,
    )).filter(_ => _);
    this.query('.buttons').before(...elements);
    return this.container;
  }

  addButtons() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('buttons', 'no-save');
    wrapper.innerHTML = buttonTemplate.innerHTML;
    this.query('.content').append(wrapper);
  }

  /** @param {import('../elements/BaseElement.js').default} element */
  #newElement(element) {
    const { content } = this.element;
    content.push(element.id);

    const render = element.renderer();
    this.#addElementEvents(render);
    this.query('.buttons').before(render.container);

    const editController = new AbortController();
    editor.on('save', () => editController.abort(), { signal: editController.signal });
    editor.on('close', () => {
      editController.abort();
      render.emit('archived');
      this.emit('save');
    }, { signal: editController.signal });

    editor.open(render);
  }

  /** @param {import('./BaseRenderer.js').default} render */
  #addElementEvents(render) {
    render.addMenu();
    const archivedController = new AbortController();
    render.one('save', () => this.emit('save'), { signal: archivedController.signal });

    render.on('archive', () => render.emit('archived'), { signal: archivedController.signal });
    render.on('archived', () => {
      const index = this.element.content.indexOf(render.element.id);
      if (!~index) return;
      this.element.content.splice(index, 1);
      render.container.remove();
      render.emit('save');
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
    this.on('save', () => {
      register(this.element);
      save(this.element.id);
    });

    this.query('.buttons button.monster').addEventListener('click', () => this.emit(Elements.Card, true));
    this.query('.buttons button.spell').addEventListener('click', () => this.emit(Elements.Card));
    this.query('.buttons button.text').addEventListener('click', () => this.emit(Elements.Text));
  }
}
