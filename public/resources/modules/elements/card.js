import style from './card.css' assert { type: 'css' };
import BaseElement from './base.js';
import { Elements } from './types.js';

document.adoptedStyleSheets.push(style);

export default class Card extends BaseElement {
  constructor({
    attack,
    cost = 0,
    effects = [''],
    health,
    image = '',
    rarity = '',
    soul = '',
    tribes = [''],
    ...rest
  } = {}) {
    super({
      ...rest,
      type: Elements.Card,
    });
    this.attack = attack;
    this.cost = cost;
    this.effects = effects.filter((_) => _);
    this.health = health;
    this.image = image;
    this.rarity = rarity;
    this.soul = soul;
    this.tribes = tribes.filter((_) => _);
  }

  setMonster() {
    if (this.health !== undefined) return;
    this.health = 0;
    this.attack = 0;
  }

  get isSpell() {
    return this.health === undefined;
  }

  toJSON() {
    const {
      attack,
      cost,
      effects,
      health,
      image,
      rarity,
      soul,
      tribes,
    } = this;
    return {
      ...super.toJSON(),
      attack,
      cost,
      effects,
      health,
      image,
      rarity,
      soul,
      tribes,
    };
  }
}