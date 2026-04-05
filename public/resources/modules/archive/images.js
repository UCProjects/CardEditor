import { events, getAll, ImageType, remove } from '../imageBank.js';
import { li, span } from '../utils/html.js';

/**
 * @typedef {import('../imageBank.js').ImageStore} ImageStore
 * @typedef {import('../imageBank.js').ImageTypes | 'misc'} ImageTypes
 */

/** @type {Record<ImageTypes, { label: string; items: ImageStore[]}>} */
const folders = {};

Object.values(ImageType).forEach((type) => folders[type] = {
  label: `${type}s`,
  items: [],
});

folders.misc = { label: 'misc.', items: [] };

/** @type {DocumentFragment} */
const template = document.getElementById('imageItem').content;
const container = document.querySelector('.archive [data-page="images"]');
const input = container.querySelector('input');
const list = container.querySelector('ul');

input.classList.add('hidden'); // TODO search/filter

export function load() {
  Object.entries(getAll()).forEach(([id, store]) => {
    if (!store.file) return;
    folders[store.type || 'misc'].items.push({ id, ...store });
  });

  Object.entries(folders).forEach(([type, { label, items }]) => {
    const header = li(span(label));
    header.className = 'group-label';
    header.dataset.type = type;
    list.append(header);
    items.forEach((item) => list.append(newItem(item)));
    refresh(type);
  });

  events.on('new',
    /** @param {ImageStore} store  */
    (store) => {
      const { type = 'misc' } = store;
      if (!store.file) return;
      const folder = folders[type];
      if (!folder) throw new Error('Unknown type');
      folder.items.push(store);
      list.querySelector(`[data-type="${type}"]:nth-last-child(1 of [data-type="${type}"])`).after(newItem(store));
      refresh(type);
    },
  );

  events.on('remove', (id) => {
    const el = list.querySelector(`[data-id="${id}"]`);
    /** @type {ImageTypes} */
    const type = el.dataset.type;
    const {items} = folders[type];
    const index = items.findIndex((store) => store.id === id);
    items.splice(index, 1);
    el.remove();
    refresh(type);
  });
}

/** @param {ImageTypes} type */
function refresh(type) {
  list.querySelector(`.group-label[data-type="${type}"]`).classList.toggle('hidden', !folders[type].items.length);
}

/** @param {ImageStore} item */
function newItem(item) {
  const { id, type, file } = item;
  const wrapper = document.importNode(template, true).querySelector('li');
  wrapper.dataset.id = id;
  wrapper.dataset.type = type;

  const name = wrapper.querySelector('.name');
  name.textContent = item.name ?? file.name ?? '(blank)';

  // TODO rename

  wrapper.querySelector('[data-tip="Delete"]').addEventListener('click', () => remove(id));

  return wrapper;
}
