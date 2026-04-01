import { uuidValidateV4 } from '../3rdparty/uuid.js';
import Text from './TextElement.js';
import Card from './CardElement.js';
import Group from './GroupElement.js';
import { Elements } from './types.js';
import EventEmitter from '../eventManager.js';
import { getElement, removeElement, setElement } from '../utils/storage.js';

export const events = new EventEmitter();

/**
 * @type {Map<string, import('./BaseElement.js').default>}
 */
const data = new Map();

export function get(id) {
  return data.get(id);
}

export function getAll() {
  return [...data.values()];
}

export function init(props) {
  switch (props.type) {
    case Elements.Card: return new Card(props);
    case Elements.Group: return new Group(props);
    case Elements.Text: return new Text(props);
    default: {
      console.dir(props);
      throw new Error(`Unknown Entity: [${props.id}, ${props.type}]`);
    }
  }
}

export function load(id) {
  if (!id) throw new Error('Must provide ID');
  if (!uuidValidateV4(id)) throw new Error(`Invalid ID: ${id}`);
  const item = getElement(id);
  if (!item) throw new Error(`Invalid Item: ${id}`);
  data.set(id, init({
    ...item,
    id,
  }));
}

/** @param {Group | Card | Text} element  */
export function register(element) {
  if (data.has(element.id)) return;
  data.set(element.id, element);
  events.emit('add', element);
}

export function remove(idOrElement) {
  const key = idOrElement.id || idOrElement;
  removeElement(key);
  const removed = data.delete(key);
  if (removed) events.emit('remove', key);
  return removed;
}

export function save(key) {
  if (key) {
    const element = data.get(key);
    if (element) {
      const { id, ...rest } = element.toJSON();
      setElement(id, rest);
    }
  } else {
    [...data.keys()].forEach(save);
  }
}
