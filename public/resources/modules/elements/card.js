import BaseElement from './base.js';
import { Elements } from './types.js';

export default class Card extends BaseElement {
  constructor({
    attack,
    cost = 0,
    description = '',
    effects = [''],
    health,
    image = '',
    name = '',
    pack = '',
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
    this.description = description;
    this.effects = effects.filter((_) => _);
    this.health = health;
    this.image = image;
    this.name = name;
    this.pack = pack;
    this.rarity = rarity;
    this.soul = soul;
    this.tribes = tribes.filter((_) => _);
  }

  get isMonster() {
    return typeof this.health === 'number';
  }

  toJSON() {
    const {
      attack,
      cost,
      description,
      effects,
      health,
      image,
      name,
      pack,
      rarity,
      soul,
      tribes,
    } = this;
    return {
      ...super.toJSON(),
      attack,
      cost,
      description,
      effects,
      health,
      image,
      name,
      pack,
      rarity,
      soul,
      tribes,
    };
  }
}