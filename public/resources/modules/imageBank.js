import { uuidV6, uuidValidate, uuidValidateV6 } from './3rdparty/uuid.js';
import { isBase64 } from './utils/funcs.js';
import { object } from './utils/smart.js';

export const ready = Promise.all([
  fetchAvatars(),
]);

export const ImageType = object(Object.freeze({
  Avatar: 'avatar',
  Artifact: 'artifact',
  Effect: 'effect',
  // Rarity: 'rarity',
  // Tribe: 'tribe',
}));

/**
 * @typedef {{
 *  id?: string;
 *  name?: string;
 *  src: string;
 *  type?: string;
 * }} ImageStore
 */

/** @type {Map<string, string>} */
const avatars = new Map();
/** @type {Map<string, ImageStore>} */
const images = new Map();

/**
 * @param {string | ImageStore} data
 * @returns {string | false} id, false if exists
 */
export function add(data) {
  if (!data) throw new Error('No image data');
  if (typeof data === 'string') {
    const id = uuidV6();
    images.set(id, { src: data });
    return id;
  }
  const {
    id = uuidV6(),
    ...store
  } = data;
  // Images are "frozen"
  if (images.has(id)) return false;
  if (uuidValidate(id) && !uuidValidateV6(id)) throw new Error(`Invalid ID: ${JSON.stringify(data)}`);
  if (!store.src) throw new Error(`Malformed data: ${JSON.stringify(data)}`);
  if (data.type && !ImageType.hasValue(data.type)) throw new Error(`Unknown data type: ${data.type}`);
  images.set(id, store);
  return id;
}

export function rename(id, name) {
  const image = images.get(id);
  if (image) {
    const changed = image.name !== name;
    image.name = name;
    return changed;
  }
  return false;
}

/**
 * @param {typeof ImageType[keyof ImageType]} type
 * @param {boolean} [strict]
 * @returns {Record<string, ImageStore>}
 */
export function getAll(type, strict = false) {
  const includeAvatars = type === ImageType.Avatar;
  return Object.fromEntries([
    ...(includeAvatars ? avatars.entries() : []),
    ...images.entries(),
  ].filter(([, value]) => (
    typeof value === 'string' ||
    (!strict && !value.type) ||
    value.type === type
  )));
}

/**
 * @param {string} id
 * @param {typeof ImageType[keyof ImageType]} [ofType]
 * @param {boolean} [strict=false]
 * @returns {string | undefined}
 */
export function getURL(id, ofType, strict = false) {
  if (!id) return undefined;
  if (id.startsWith('http') || isBase64(id)) {
    return id;
  }
  if (avatars.has(id) && (!ofType || ofType === ImageType.Avatar)) {
    return `/resources/avatar/${avatars.get(id)}.png`;
  }
  const { src = '', type } = images.get(id) || {};
  if (ofType && (type ? type !== ofType : strict)) return undefined;
  return src || undefined;
}

export function save(id) {
  const image = images.get(id);
  if (!image) throw new Error('Failed to find image');
  localStorage.setItem(id, JSON.stringify(image));
}

async function fetchAvatars() {
  const raw = await fetch(`/resources/data/avatars.json`);
  const data = await raw.json();
  Object.entries(data).forEach(([key, value]) => {
    avatars.set(key, value);
  });
}
