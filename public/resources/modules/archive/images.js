import { events, getAll, ImageType, remove } from '../imageBank.js';
import { li, span } from '../utils/html.js';
import { bindFilter, matches } from './filter.js';

/**
 * @typedef {import('../imageBank.js').StoredImage} StoredImage
 * @typedef {import('../imageBank.js').ImageTypes | 'misc'} ImageTypes
 */

/** @type {Record<ImageTypes, { label: string; items: StoredImage[]}>} */
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
    /** @param {StoredImage} store  */
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
    if (!el) return;
    /** @type {ImageTypes} */
    const type = el.dataset.type;
    const {items} = folders[type];
    const index = items.findIndex((store) => store.id === id);
    items.splice(index, 1);
    el.remove();
    refresh(type);
  });

  bindFilter(input, applyFilter);
}

/** @param {ImageTypes} type */
function applyFilter(query) {
  list.classList.toggle('filtering', !!query);
  list.querySelectorAll('li[data-id]').forEach((row) => {
    row.classList.toggle('filtered', !matches(row, query));
  });
  Object.keys(folders).forEach(refresh);
}

function refresh(type) {
  const visible = list.querySelectorAll(`li[data-id][data-type="${type}"]:not(.filtered)`).length;
  list.querySelector(`.group-label[data-type="${type}"]`).classList.toggle('hidden', !visible);
}

/** @param {StoredImage} item */
function newItem(item) {
  const { id, type = 'misc', file } = item;
  const wrapper = document.importNode(template, true).querySelector('li');
  wrapper.dataset.id = id;
  wrapper.dataset.type = type;

  const name = wrapper.querySelector('.name');
  name.textContent = item.name ?? file.name ?? '(blank)';

  // TODO rename

  wrapper.querySelector('[data-tip="Delete"]').addEventListener('click', () => remove(id));

  return wrapper;
}
