import { add as addImage, getAll as getImages, isUserImage, save as saveImage } from './imageBank.js';
import { get, init, isTaken, register, save } from './elements/registry.js';
import { Elements } from './elements/types.js';
import { download, read } from './utils/file.js';
import { AUTO_HIDE_MS, toast, tryOrError } from './toast/index.js';
import { imageRefs } from './utils/imageRefs.js';
import { stripEmpty } from './utils/funcs.js';

export const VERSION = 1;

export const Action = Object.freeze({
  Copy: 'copy',
  Replace: 'replace',
  Skip: 'skip',
});

/** @typedef {typeof Action[keyof typeof Action]} Action */

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

/** @param {string} src */
function portable(src) {
  const prefix = `${location.origin}/`;
  return src.startsWith(prefix) ? src.slice(prefix.length - 1) : src;
}

/** @param {import('./elements/BaseElement.js').default} element */
function assetIds(element) {
  return imageRefs(element).filter((id) => id && isUserImage(id));
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
    assets[id] = { src: portable(source) };
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

/** @param {import('./elements/BaseElement.js').default} element */
export async function exportElement(element) {
  const bundle = await tryOrError(() => pack(element), 'Failed to export');
  if (!bundle) return;
  download(JSON.stringify(bundle), `${element.name || element.type}.json`);
}

/** @param {import('./elements/BaseElement.js').default} element */
export async function copyElement(element) {
  const text = pack(element, { withAssets: false })
    .then((bundle) => new Blob([JSON.stringify(bundle)], { type: 'text/plain' }));
  const copied = await tryOrError(async () => {
    await navigator.clipboard.write([new ClipboardItem({ 'text/plain': text })]);
    return true;
  }, 'Failed to copy');
  if (copied) toast({ body: 'Copied to clipboard', signal: AbortSignal.timeout(AUTO_HIDE_MS) });
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
 * @param {string} text
 * @returns {Bundle | undefined}
 */
export function parseBundle(text) {
  if (typeof text !== 'string' || !text.trimStart().startsWith('{')) return undefined;
  try {
    const data = JSON.parse(text);
    return typeof data?.version === 'number' && Array.isArray(data.elements) ? data : undefined;
  } catch {
    return undefined;
  }
}

/**
 * @typedef {{
 *  id: string;
 *  type: string;
 *  name: string;
 *  exists: boolean;
 *  trashed: boolean;
 *  parent?: string;
 * }} BundleItem
 */

/** @param {Bundle} bundle */
export function inspect(bundle) {
  const { assets, elements } = validate(bundle);
  const parents = new Map(elements.flatMap(({ id, content = [] }) => content.map((child) => [child, id])));
  /** @type {BundleItem[]} */
  const items = elements.map(({ id, type, name }) => ({
    id,
    type,
    name: name || type,
    exists: get(id)?.type === type,
    trashed: isTaken(id) && !get(id),
    parent: parents.get(id),
  }));
  return { elements: elements.length, assets: Object.keys(assets).length, items };
}

/**
 * @param {import('./elements/BaseElement.js').default} existing
 * @param {object} data
 */
function overwrite(existing, data) {
  const fields = init({ ...data, id: undefined }).toJSON();
  delete fields.id;
  delete fields.type;
  delete fields.content;
  existing.emit('update', fields);
}

/**
 * @param {Bundle} bundle
 * @param {{ assets?: boolean; actions?: Record<string, Action>; }} [options]
 * @returns {Promise<import('./elements/BaseElement.js').default[]>} the new roots
 */
export async function unpack(bundle, { assets: withAssets = true, actions = {} } = {}) {
  const { assets, elements } = validate(bundle);

  const ids = new Map();
  const created = [];
  const replaced = [];
  elements.forEach((data) => {
    const action = actions[data.id] ?? Action.Copy;
    if (action === Action.Skip) return;
    const existing = get(data.id);
    if (action === Action.Replace && existing?.type === data.type) {
      overwrite(existing, data);
      ids.set(data.id, existing.id);
      replaced.push({ element: existing, data });
      return;
    }
    const element = init({ ...data, id: isTaken(data.id) ? undefined : data.id });
    ids.set(data.id, element.id);
    created.push(element);
  });

  if (withAssets) for (const [id, asset] of Object.entries(assets)) await restoreAsset(id, asset);

  created.forEach((element) => {
    if (element.type !== Elements.Group) return;
    const content = element.content.map((id) => ids.get(id)).filter(Boolean);
    element.content.length = 0;
    element.content.push(...content);
  });

  const children = new Set([
    ...created.flatMap(({ content = [] }) => content),
    ...replaced.flatMap(({ data }) => (data.content ?? []).map((id) => ids.get(id))),
  ]);

  const createdById = new Map(created.map((element) => [element.id, element]));
  replaced.filter(({ element }) => element.type === Elements.Group).forEach(({ element, data }) => {
    (data.content ?? [])
      .map((id) => createdById.get(ids.get(id)))
      .filter((child) => child && !element.content.includes(child.id))
      .forEach((child) => {
        if (element.isActive()) element.renderer().emit('drop', child);
        else element.content.push(child.id);
      });
  });

  [...created].sort(groupsLast).forEach((element) => {
    register(element);
    save(element);
  });

  replaced.forEach(({ element }) => save(element));

  return created.filter(({ id }) => !children.has(id));
}
