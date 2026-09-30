import { add as addImage, getAll as getImages, isUserImage, save as saveImage } from './imageBank.js';
import { get, init, register, save } from './elements/registry.js';
import { Elements } from './elements/types.js';
import { asArray } from './utils/array.js';
import { read } from './utils/file.js';
import { stripEmpty } from './utils/funcs.js';

export const VERSION = 1;

/**
 * @typedef {{
 *  src: string;
 *  name?: string;
 *  type?: import('./imageBank.js').ImageTypes;
 * }} BundleAsset
 *
 * @typedef {{
 *  version: number;
 *  assets: Record<string, BundleAsset>;
 *  elements: object[];
 * }} Bundle
 */

function groupsLast(a, b) {
  return Number(a.type === Elements.Group) - Number(b.type === Elements.Group);
}

/** @param {import('./elements/BaseElement.js').default} element */
function assetIds({ effects = [], image, rarity, tribes = [] }) {
  return [image, rarity, ...tribes, ...effects.map((entry) => asArray(entry)[0])]
    .filter((id) => id && isUserImage(id));
}

/**
 * @param {import('./elements/BaseElement.js').default} element
 * @param {{ withAssets?: boolean }} [options]
 * @returns {Promise<Bundle>}
 */
export async function pack(element, { withAssets = true } = {}) {
  if (!element) throw new Error('Nothing to export');
  /** @type {Record<string, BundleAsset>} */
  const assets = {};
  const elements = [];
  const seen = new Set();
  const images = getImages();

  async function addAsset(id) {
    if (assets[id]) return;
    const store = images[id];
    if (!store) return;
    const { file, name, src, type } = store;
    const source = file instanceof File ? await read(file) : src;
    if (!source || source.startsWith('blob:')) return;
    assets[id] = { src: source };
    const label = name || file?.name;
    if (label) assets[id].name = label;
    if (type) assets[id].type = type;
  }

  async function addElement(el) {
    if (!el || seen.has(el.id)) return;
    seen.add(el.id);
    elements.push(JSON.parse(JSON.stringify(el.toJSON(), stripEmpty)));
    if (withAssets) for (const id of assetIds(el)) await addAsset(id);
    if (el.type !== Elements.Group) return;
    for (const id of el.content) await addElement(get(id));
  }

  await addElement(element);

  return { version: VERSION, assets, elements };
}

/** @param {Bundle} bundle */
function validate(bundle) {
  if (!bundle || typeof bundle !== 'object') throw new Error('Not a valid export');
  const { assets = {}, elements, version } = bundle;
  if (version !== VERSION) throw new Error(`Unsupported export version: ${version}`);
  if (!Array.isArray(elements) || !elements.length) throw new Error('Export has no elements');
  if (!assets || typeof assets !== 'object') throw new Error('Export has malformed assets');
  return { assets, elements };
}

/** @param {BundleAsset} asset */
async function restoreAsset(id, { name, src, type }) {
  if (!src || src.startsWith('blob:')) return;
  if (getImages()[id]) return;
  const data = { id, name, type };
  if (src.startsWith('data:')) {
    const blob = await (await fetch(src)).blob();
    data.file = new File([blob], name || id, { type: blob.type });
  } else {
    data.src = src;
  }
  if (addImage(data)) await saveImage(id);
}

/**
 * @param {Bundle} bundle
 * @returns {Promise<import('./elements/BaseElement.js').default[]>} the roots
 */
export async function unpack(bundle) {
  const { assets, elements } = validate(bundle);

  const ids = new Map();
  const built = elements.map((data) => {
    const id = get(data.id) ? undefined : data.id;
    const element = init({ ...data, id });
    ids.set(data.id, element.id);
    return element;
  });

  for (const [id, asset] of Object.entries(assets)) await restoreAsset(id, asset);

  built.forEach((element) => {
    if (element.type !== Elements.Group) return;
    const content = element.content.map((id) => ids.get(id)).filter(Boolean);
    element.content.length = 0;
    element.content.push(...content);
  });

  const children = new Set(built.flatMap(({ content = [] }) => content));

  [...built].sort(groupsLast).forEach((element) => {
    register(element);
    save(element);
  });

  return built.filter(({ id }) => !children.has(id));
}
