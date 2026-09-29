import style from '../../styles/card.css' with { type: 'css' };
import Renderer from './ImageRenderer.js';
import { asArray } from '../utils/array.js';
import resize from '../utils/resize.js';
import { getName, getURL, ImageType, isUserImage } from '../imageBank.js';
import { adoptStyle } from '../utils/funcs.js';
import { isHashHex } from '../utils/color.js';
import { Souls } from '../elements/types.js';
import settings, { Settings } from '../settings.js';

adoptStyle(style);

/** @type {HTMLTemplateElement} */
const tribeTemplate = document.querySelector('template#selectTribe');

const determinationEffect = 'Determination';

export default class CardRenderer extends Renderer {
  #abortController;

  constructor(...args) {
    super(...args);
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;
    if (!this.element.isSpell()) {
      settings.on(Settings.MonsterSoul, () => this.soul(), { signal });
    }
    settings.on(Settings.AddDetermination, () => this.effects(), { signal });
  }

  /** @type {import('../elements/CardElement.js').default} */
  get element() {
    return super.element;
  }

  attack() {
    this.query('.bottom .attack').textContent = this.element.attack;
  }

  cost() {
    this.query('.top .cost').textContent = this.element.cost;
  }

  description() {
    super.description();
    resize(this.query('.description'));
  }

  effects() {
    const entries = [...this.element.effects];
    const listed = entries.some((entry) => asArray(entry)[0] === determinationEffect);
    if (!listed &&
      settings.enabled(Settings.AddDetermination) &&
      this.element.rarity?.startsWith(determinationEffect.toUpperCase())
    ) {
      entries.unshift(determinationEffect);
    }
    const effects = entries.map((entry) => {
      const [effect, count = 0] = asArray(entry);
      const src = getURL(effect, ImageType.Effect);
      if (!src) return '';
      const span = document.createElement('span');
      const img = document.createElement('img');
      img.src = src;
      img.alt = effect;
      img.draggable = false;
      span.dataset.overlay = count;
      span.append(img);
      return span;
    });
    this.query('.middle .status').replaceChildren(...effects);
  }

  health() {
    this.query('.bottom .health').textContent = this.element.health;
  }

  name() {
    super.name();
    resize(this.query('.top .name'), { height: false, size: 16 });
  }

  rarity() {
    const { rarity } = this.element;
    const path = isUserImage(rarity) ?
      getURL(rarity, ImageType.Rarity) :
      `/rarity/${rarity || 'COMMON'}.png`;
    this.query('.bottom .rarity img').src = path;
    this.effects();
  }

  soul() {
    const { dataset, style: inline } = this.container;
    delete dataset.soul;
    inline.removeProperty('--SOUL');
    const { soul } = this.element;
    if (!soul) return;
    if (!this.element.isSpell() && !settings.enabled(Settings.MonsterSoul)) return;
    const isCustom = isHashHex(soul);
    if (!isCustom && !Souls.includes(soul)) return;
    dataset.soul = isCustom ? 'CUSTOM' : soul;
    if (isCustom) inline.setProperty('--SOUL', soul);
  }

  tribes() {
    const tribes = document.importNode(tribeTemplate.content, true);
    const elements = this.element.tribes.map((tribe) => {
      const element = tribes.querySelector(`[data-tribe="${tribe}"]`);
      if (element) {
        element.classList.remove('selectable');
        return element;
      }
      const src = getURL(tribe, ImageType.Tribe);
      if (!src) return undefined;
      const img = document.createElement('img');
      img.src = src;
      img.alt = getName(tribe) ?? '';
      img.classList.add('smallIcon');
      img.draggable = false;
      return img;
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

  unload() {
    this.#abortController.abort();
    super.unload();
  }
}
