import style from '../../styles/card.css' with { type: 'css' };
import Renderer from './ImageRenderer.js';
import { filter } from '../utils/array.js';

document.adoptedStyleSheets.push(style);

export default class CardRenderer extends Renderer {
  /** @type {import('../elements/CardElement.js').default} */
  get element() {
    return super.element;
  }

  attack() {
    this.query('.attack').textContent = this.element.attack;
  }

  cost() {
    this.query('.cost').textContent = this.element.cost;
  }

  description() {
    super.description();
    // TODO resize text
  }

  effects() {
    this.query('.effects [data-effect="none"]')?.classList.toggle('active', !this.element.effects.length);

    this.queryAll('.effects [data-effect]').forEach((el) => {
      const effect = el.dataset.effect;
      el.classList.toggle('active', this.element.effects.includes(effect));
    });

    // TODO Allow custom
  }

  health() {
    this.query('.health').textContent = this.element.health;
  }

  name() {
    super.name();
    // TODO resize text
  }

  rarity() {
    const { rarity } = this.element;
    this.query('.rarity img').src = `/rarity/${rarity || 'COMMON'}.png`;

    // TODO Allow custom
  }

  soul() {
    const list = this.query('.name').classList;
    list.remove(...filter(list, 'name'));
    const { soul } = this.element;
    if (soul) list.add(soul);
  }

  tribes() {
    // TODO render elements rather than load from template
    this.queryAll('.tribes [data-tribe]').forEach((el) => {
      const tribe = el.dataset.tribe;
      el.classList.remove('selectable');
      const { tribes } = this.element;
      el.classList.toggle('hidden', !tribes.includes(tribe));
    });
    // TODO Allow custom
  }

  render() {
    // TODO remove this
    this.queryAll('[data-template]').forEach((el) => {
      const template = el.dataset.template;
      el.innerHTML = document.getElementById(template)?.innerHTML ?? `Failed to load ${template}`;
    });
    super.render();
    this.attack();
    this.cost();
    this.effects();
    this.health();
    this.rarity();
    this.soul();
    this.tribes();
  }

  getElement() {
    const element = super.getElement();
    element.classList.toggle('spell', this.element.isSpell());
    return element;
  }
}
