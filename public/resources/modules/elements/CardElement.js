import BaseElement from './ImageElement.js';
import { Elements } from './types.js';

export default class CardElement extends BaseElement {
  /** @type {number | undefined} */
  #attack;
  cost;
  /** @type {string[]} */
  effects = [];
  /** @type {number | undefined} */
  #health;
  rarity;
  soul;
  /** @type {string[]} */
  tribes = [];

  constructor({
    attack,
    cost = 0,
    effects = [],
    health,
    rarity = '',
    soul = '',
    tribes = [],
    ...rest
  } = {}) {
    super({
      ...rest,
      type: Elements.Card,
    });
    this.#attack = attack;
    this.cost = cost;
    this.effects.push(...effects);
    this.#health = health;
    this.rarity = rarity;
    this.soul = soul;
    this.tribes.push(...tribes);
  }

  get attack() {
    return this.#attack;
  }

  set attack(value = 0) {
    if (this.isSpell()) throw new Error('Adding attack to spell');
    if (value < 0) throw new Error('Invalid attack value');
    this.#attack = value;
  }

  get health() {
    return this.#health;
  }

  set health(value = 0) {
    if (this.isSpell()) throw new Error('Adding health to spell');
    if (value < 0) throw new Error('Invalid health value');
    this.#health = value;
  }

  setMonster() {
    if (this.#health !== undefined) return;
    this.#health = 0;
    this.#attack = 0;
  }

  isSpell() {
    return this.#health === undefined;
  }

  toJSON() {
    const {
      attack,
      health,
    } = this;
    return {
      ...super.toJSON(),
      attack,
      health,
    };
  }
}
