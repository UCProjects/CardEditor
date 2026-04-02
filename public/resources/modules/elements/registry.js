import { uuidValidateV4 } from '../3rdparty/uuid.js';
import BaseElement from './BaseElement.js';
import Text from './TextElement.js';
import Card from './CardElement.js';
import Group from './GroupElement.js';
import { Elements } from './types.js';
import { getElement, removeElement, setElement } from '../utils/storage.js';
import events from './registryEvents.js';

export { events };

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

/** @param {Group | Card | Text} element  */
export function remove(element) {
  const key = element.id;
  removeElement(key);
  data.delete(key);
  events.emit('remove', element);
}

export function save(keyOrElement) {
  if (typeof keyOrElement === 'string') {
    save(get(keyOrElement));
  } else if (keyOrElement instanceof BaseElement) {
    const { id, ...rest } = keyOrElement.toJSON();
    setElement(id, rest);
  } else {
    throw new Error(`Failed to save [${JSON.stringify(keyOrElement)}]`);
  }
}
