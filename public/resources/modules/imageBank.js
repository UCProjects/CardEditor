import { uuidV6, uuidValidateV6 } from './3rdparty/uuid.js';
import { isBase64 } from './utils/funcs.js';

export const ready = Promise.all([
  fetchAvatars(),
]);

export const ImageType = Object.freeze({
  Avatar: 'avatar',
  Artifact: 'artifact',
  // Rarity: 'rarity',
  // Tribe: 'tribe',
});

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
 * @returns {string} id
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
  if (data.id && images.has(id)) return id;
  if (!uuidValidateV6(id)) throw new Error(`Invalid ID: ${JSON.stringify(data)}`);
  if (!store.src) throw new Error(`Malformed data: ${JSON.stringify(data)}`);
  if (data.type && !ImageType[data.type]) throw new Error(`Unknown data type: ${data.type}`);
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

export function getURL(id, ofType) {
  if (avatars.has(id)) {
    return `./resources/avatar/${avatars.get(id)}.png`;
  }
  const { src = '', type } = images.get(id) || {};
  const matchType = ofType && type === ofType;
  if (!matchType) return undefined;
  // Images must be external OR base64
  if (src.startsWith('http') || isBase64(src)) {
    return src;
  }
  return undefined;
}

export function save(id) {
  const image = images.get(id);
  if (!image) throw new Error('Failed to find image');
  localStorage.setItem(id, JSON.stringify(image));
}

async function fetchAvatars() {
  // TODO Load avatars
}
