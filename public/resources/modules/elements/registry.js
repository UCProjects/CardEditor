import { uuidValidateV4 } from '../3rdparty/uuid.js';
import Text from './TextElement.js';
import Card from './CardElement.js';
import Group from './GroupElement.js';
import { Elements } from './types.js';

/**
 * @type {Map<string, import('./BaseElement.js').default>}
 */
const data = new Map();

export function load(id) {
  if (!id) throw new Error('Must provide ID');
  if (!uuidValidateV4(id)) throw new Error(`Invalid ID: ${id}`);
  const item = localStorage.getItem(id);
  if (!item) throw new Error(`Invalid Item: ${id}`);
  data.set(id, init({
    ...JSON.parse(item),
    id,
  }));
}

export function save(key) {
  if (key) {
    const element = data.get(key);
    if (element) {
      const {
        id,
        ...rest
      } = element.toJSON();

      localStorage.setItem(id, JSON.stringify(rest, (_, value) => {
        if (Array.isArray(value)) {
          if (!value.length) return undefined;
        } else if (typeof value === 'string') {
          return value.trim() || undefined;
        }
        return value;
      }));
    }
  } else {
    [...data.keys()].forEach(save);
  }
}

export function get(id) {
  return data.get(id);
}

export function getAll() {
  return [...data.values()];
}

export function remove(key) {
  return data.delete(key);
}

/** @param {Group | Card | Text} element  */
export function register(element) {
  data.set(element.id, element);
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
