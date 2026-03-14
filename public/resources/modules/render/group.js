import style from './group.css' with { type: 'css' };
import Renderer from './base.js';
import { get, init } from '../elements/registry.js';
import { Elements } from '../elements/types.js';
import editor from '../editor/editor.js';

document.adoptedStyleSheets.push(style);

const buttonTemplate = document.querySelector('#groupButtons');

// TODO how to support "sorting/dragging"
export default class GroupRenderer extends Renderer {
  /** @type {import('../elements/group.js').default} */
  get element() {
    return super.element;
  }

  /** Must be manually called */
  content() {
    if (this.query('.buttons')) return;
    this.addMenu();
    this.addButtons();
    this.#addEvents();
    const elements = this.element.content.map((id) => {
      try {
        const render = get(id).renderer();
        render.addMenu();
        // Add Events
        return render.container;
      } catch {
        // TODO toast failed to load element
      }
      return undefined;
    }).filter(_ => _);
    this.query('.buttons').before(...elements);
    return this.container;
  }

  addButtons() {
    // TODO #groupButtons, `class="buttons no-save"`
    const wrapper = document.createElement('div');
    wrapper.classList.add('buttons', 'no-save');
    wrapper.innerHTML = buttonTemplate.innerHTML;
    this.query('.content').append(wrapper);
  }

  #newElement(element) {
    // TODO only add on save? delete on cancel?
    this.element.content.push(element.id);
    const render = element.renderer();
    render.addMenu();
    this.query('.buttons').before(render.container);
    editor.open(render);
  }

  #addEvents() {
    // TODO new group
    this.on(Elements.Card, (monster = false) => {
      const props = { type: Elements.Card };
      if (monster) {
        props.health = 0;
        props.attack = 0;
      }
      this.#newElement(init(props));
    });
    this.on(Elements.Text, () => this.#newElement(init({ type: Elements.Text })));

    this.query('.buttons button.monster').addEventListener('click', () => this.emit(Elements.Card, true));
    this.query('.buttons button.spell').addEventListener('click', () => this.emit(Elements.Card));
    this.query('.buttons button.text').addEventListener('click', () => this.emit(Elements.Text));
  }
}
