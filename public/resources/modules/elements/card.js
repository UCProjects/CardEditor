import BaseElement from './base';

export default class Card extends BaseElement {
  #health;
  #attack;
  #soul;
  #tribes;
  #image;

  constructor(data = {}) {
    super(data);
    const {
      health = -1,
      attack = -1,
      soul = '',
      tribes = [''],
      image = '',
    } = data;
    this.#health = health;
  }
}