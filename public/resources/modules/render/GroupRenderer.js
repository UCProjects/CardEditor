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
    this.#addEvents();
    const elements = this.element.content.map((id) => tryOrErrorSync(
      () => {
        const render = get(id).renderer();
        render.addMenu();
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

  #newElement(element) {
    const { content } = this.element;
    content.push(element.id);

    const render = element.renderer();
    render.addMenu();
    this.query('.buttons').before(render.container);

    editor.open(render);

    const controller = new AbortController();
    editor.one('save', () => {
      if (controller.signal.aborted) return;
      this.emit('save');
      controller.abort();
    }, { signal: controller.signal });
    editor.one('close', () => {
      if (controller.signal.aborted) return;
      controller.abort();
      const index = content.indexOf(element.id);
      if (!~index) return;
      content.splice(index, 1);
      this.emit('save');
    }, { signal: controller.signal });
  }

  #addEvents() {
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
