import BaseElement from './base.js';
import { Elements } from './types.js';

export default class Card extends BaseElement {
  constructor({
      attack,
      health,
      image = '',
      soul = '',
      status = [''],
      tribes = [''],
    ...rest
  } = {}) {
    super({
      ...rest,
      type: Elements.Card,
    });
    this.attack = attack;
    this.health = health;
    this.image = image;
    this.soul = soul;
    this.status = status.filter((_) => _);
    this.tribes = tribes.filter((_) => _);
  }

  get isMonster() {
    return this.health !== undefined;
  }

  toJSON() {
    const {
      attack,
      health,
      image,
      soul,
      status,
      tribes,
    } = this;
    return {
      ...super.toJSON(),
      attack,
      health,
      image,
      soul,
      status,
      tribes,
    };
  }
}