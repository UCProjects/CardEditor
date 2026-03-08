import style from './card.css' with { type: 'css' };
import Renderer from './image.js';
import { filter } from '../utils/array.js';

document.adoptedStyleSheets.push(style);

export default class CardRenderer extends Renderer {
  /** @type {import('../elements/card.js').default} */
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
    this.query('.effects [data-effect="none"]').classList.toggle('active', !this.element.effects.length);

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
    this.query('rarity img').src = `/rarity/${this.element.rarity}.png`;

    // TODO Allow custom
  }

  soul() {
    const list = this.query('.name').classList;
    list.remove(...filter(list, 'name'));
    const { soul } = this.element;
    if (!soul) return;
    list.add(soul);
  }

  tribes() {
    this.queryAll('.effects [data-tribe]').forEach((el) => {
      const tribe = el.dataset.tribe;
      el.classList.toggle('active', this.element.tribes.includes(tribe));
    });
    // TODO Allow custom
  }

  render() {
    super.render();
    this.attack();
    this.cost();
    this.effects();
    this.health();
    this.rarity();
    this.soul();
    this.tribes();
  }
}
