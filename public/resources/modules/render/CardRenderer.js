import style from '../../styles/card.css' with { type: 'css' };
import Renderer from './ImageRenderer.js';
import { asArray } from '../utils/array.js';
import resize from '../utils/resize.js';
import { getName, getURL, ImageType, isUserImage } from '../imageBank.js';
import { adoptStyle } from '../utils/funcs.js';
import { frameLayout, frameURL, parseFrame } from '../frames.js';
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
    settings.on(Settings.SilenceOverlay, () => this.silence(), { signal });
    settings.on(Settings.GameTextSize, () => {
      this.gameText();
      this.name();
      this.description();
    }, { signal });
  }

  /** @type {import('../elements/CardElement.js').default} */
  get element() {
    return super.element;
  }

  attack() {
    this.query('.card > .attack').textContent = this.element.attack;
  }

  cost() {
    this.query('.card > .cost').textContent = this.element.cost;
  }

  description() {
    super.description();
    const size = settings.enabled(Settings.GameTextSize) ? 12 : 12.8;
    resize(this.query('.description'), { size });
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
    this.query('.card > .status').replaceChildren(...effects);
    this.silence();
  }

  silence() {
    const silenced = !this.element.isSpell() &&
      settings.enabled(Settings.SilenceOverlay) &&
      this.element.effects.some((entry) => asArray(entry)[0] === 'Silenced');
    this.query('.card').classList.toggle('silenced', silenced);
  }

  health() {
    this.query('.card > .health').textContent = this.element.health;
  }

  frame() {
    const { skin, shiny } = parseFrame(this.element.frame);
    const kind = this.element.isSpell() ? 'spell' : 'monster';
    this.query('.card > .frame').style.backgroundImage = `url('${frameURL(skin, kind)}')`;
    const overlay = this.query('.card > .shinySlot');
    overlay.style.setProperty('--shiny', shiny ? `url('${frameURL(skin, shiny)}')` : 'none');
    overlay.style.setProperty('--shiny-still', shiny ? `url('${frameURL(skin, 'shiny')}')` : 'none');
    const card = this.query('.card');
    card.classList.toggle('shiny', Boolean(shiny));

    const layout = frameLayout(skin);
    card.style.setProperty('--background-height', `${layout.backgroundHeight}px`);
    card.style.setProperty('--desc-top', `${layout.descTop}px`);
    card.style.setProperty('--name-left', `${layout.nameLeft}px`);
    card.style.setProperty('--name-top', `${layout.nameTop}px`);
    card.style.setProperty('--rarity-top', `${layout.rarityTop}px`);
    card.style.setProperty('--stats-top', `${layout.statsTop}px`);
  }

  gameText() {
    this.container.toggleAttribute('data-game-text', settings.enabled(Settings.GameTextSize));
  }

  name() {
    super.name();
    const size = settings.enabled(Settings.GameTextSize) ? 12 : 16;
    resize(this.query('.card > .name'), { height: false, size });
  }

  rarity() {
    const { rarity } = this.element;
    const path = isUserImage(rarity) ?
      getURL(rarity, ImageType.Rarity) :
      `/rarity/${rarity || 'COMMON'}.png`;
    this.query('.card > .rarity img').src = path;
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
    this.gameText();
    super.render();
    this.attack();
    this.cost();
    this.effects();
    this.frame();
    this.health();
    this.rarity();
    this.soul();
    this.tribes();
  }

  getElement() {
    const element = super.getElement();
    element.querySelector('.card').classList.toggle('spell', this.element.isSpell());
    return element;
  }

  unload() {
    this.#abortController.abort();
    super.unload();
  }
}
