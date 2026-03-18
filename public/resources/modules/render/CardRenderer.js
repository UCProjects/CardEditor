import style from '../../styles/card.css' with { type: 'css' };
import Renderer from './ImageRenderer.js';
import { filter } from '../utils/array.js';
import resize from '../resize.js';

document.adoptedStyleSheets.push(style);

/** @type {HTMLTemplateElement} */
const tribeTemplate = document.querySelector('template#selectTribe');

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
    resize(this.query('.description'));
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
    resize(this.query('.name'), { height: false, size: 16 });
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
    const tribes = document.importNode(tribeTemplate.content, true);
    const elements = this.element.tribes.map((tribe) => {
      const element = tribes.querySelector(`[data-tribe="${tribe}"]`);
      if (element) {
        element.classList.remove('selectable');
        return element;
      } else {
        // TODO Custom?
        return undefined;
      }
    }).filter(_ => _);
    this.query('.tribes').replaceChildren(...elements);
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

  getElement() {
    const element = super.getElement();
    element.classList.toggle('spell', this.element.isSpell());
    return element;
  }
}
