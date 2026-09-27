import { uuidV6, uuidValidate, uuidValidateV6 } from './3rdparty/uuid.js';
import EventEmitter from './utils/EventEmitter.js';
import { hasValue } from './utils/funcs.js';
import loadResource from './utils/resource.js';
import { set as setImage, remove as removeImage } from './utils/imageDB.js';

export const ready = Promise.all([
  fetchAvatars(),
]);

export const events = new EventEmitter();

export const ImageType = Object.freeze({
  Avatar: 'avatar',
  Artifact: 'artifact',
  Effect: 'effect',
  // Rarity: 'rarity',
  Tribe: 'tribe',
});

/**
 * @typedef {typeof ImageType[keyof typeof ImageType]} ImageTypes
 *
 * @typedef {{
 *  id?: string;
 *  name?: string;
 *  type?: ImageTypes;
 * }} ImageBase
 *
 * @typedef {ImageBase & { src: string; file?: never; }} SourceImage
 * @typedef {ImageBase & { file: File; src?: string; }} FileImage
 *
 * @typedef {SourceImage | FileImage} ImageStore
 * @typedef {ImageStore & { id: string }} StoredImage
 */

/** @type {Map<string, string>} */
const avatars = new Map();
/** @type {Map<string, ImageStore>} */
const images = new Map();

/**
 * @param {ImageStore} data
 * @returns {string | false} id, false if exists
 */
export function add(data) {
  if (!data) throw new Error('No image data');
  const {
    id = uuidV6(),
    ...store
  } = data;
  // Images are "frozen"
  if (images.has(id)) return false;
  if (uuidValidate(id) && !uuidValidateV6(id)) throw new Error(`Invalid ID: ${JSON.stringify(data)}`);
  if (!(store.src || store.file)) throw new Error(`Malformed data: ${JSON.stringify(data)}`);
  if (data.type && !hasValue(ImageType, data.type)) throw new Error(`Unknown data type: ${data.type}`);
  images.set(id, store);
  events.emit('new', { id, ...store });
  return id;
}

/**  @param {string} key */
export async function remove(key) {
  const store = images.get(key);
  if (!store) return;
  images.delete(key);
  if (store.file) URL.revokeObjectURL(store.src);
  await removeImage(key);
  events.emit('remove', key);
}

export async function rename(id, name) {
  const image = images.get(id);
  if (!image || image.name === name) return false;
  image.name = name;
  if (image.file instanceof File) await save(id);
  return true;
}

/** @param {string} id */
export function isUserImage(id) {
  return uuidValidateV6(id);
}

export function getName(id) {
  const store = images.get(id);
  if (!store) return store;
  return store.name || store.file?.name;
}

/**
 * @param {ImageTypes} [type]
 * @param {boolean} [strict]
 * @returns {Record<string, ImageStore>}
 */
export function getAll(type, strict = false) {
  if (!type) return Object.fromEntries(images.entries());
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
 * @param {ImageTypes} [ofType]
 * @param {boolean} [strict=false]
 * @returns {string | undefined}
 */
export function getURL(id, ofType, strict = false) {
  if (!id) return '';
  if (id.startsWith('http')) return id;
  if (avatars.has(id) && (!ofType || ofType === ImageType.Avatar)) {
    return `/resources/images/avatars/${avatars.get(id)}.png`;
  }
  const store = images.get(id) || {};
  const { src = '', type, file } = store;
  if (ofType && (type ? type !== ofType : strict)) return '';
  if (src) return src;
  if (file) {
    const url = URL.createObjectURL(file);
    store.src = url;
    return url;
  }
  return '';
}

export function hasFile(id, file) {
  const saved = images.get(id)?.file;
  return saved instanceof File && (!file || saved === file);
}

export async function save(id) {
  const image = images.get(id);
  if (!image) throw new Error('Failed to find image');
  const { src, file, ...data } = image;
  if (file instanceof File) return setImage(id, { ...data, file });
  if (!src || src.startsWith('blob:')) throw new Error('Tried to save generic image');
  return setImage(id, { ...data, src });
}

async function fetchAvatars() {
  const data = await loadResource('avatars');
  Object.entries(data).forEach(([key, value]) => {
    avatars.set(key, value);
  });
}
