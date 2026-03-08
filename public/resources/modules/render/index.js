import { Elements } from '../elements/types.js';
import Card from './card.js';
import Group from './group.js';
import Text from './text.js';

/** @param {import('../elements/base.js').default} element  */
export default function initialize(element) {
  switch (element.type) {
    case Elements.Card: return new Card(element);
    case Elements.Group: return new Group(element);
    case Elements.Text: return new Text(element);
    default: throw new Error(`Unknown element: ${element.id} [${element.type}]`);
  }
}
