import { events, getAll, getName, getURL, ImageType, isUserImage, remove, rename } from '../imageBank.js';
import { getAll as getElements } from '../elements/registry.js';
import confirm from '../confirm/index.js';
import { asArray } from '../utils/array.js';
import { li, span } from '../utils/html.js';
import { bindFilter, matches } from './filter.js';
import { tryOrError } from '../toast/index.js';

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
    if (!isUserImage(id)) return;
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
      const { id, type = 'misc' } = store;
      if (!isUserImage(id)) return;
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

/** @param {string} id */
function usedBy(id) {
  return getElements().filter((element) => (
    element.image === id ||
    element.effects?.some((entry) => asArray(entry)[0] === id)
  )).length;
}

/** @param {string} id */
async function confirmRemove(id) {
  const used = usedBy(id);
  if (used) {
    const accepted = await confirm({
      title: 'Delete image',
      body: `${getName(id) || 'This image'} is used by ${used} ${used === 1 ? 'element' : 'elements'}, which will lose it.`,
      accept: 'Delete',
      destructive: true,
    });
    if (!accepted) return;
  }
  await tryOrError(() => remove(id), 'Failed to delete the image');
}

/** @param {string} id */
function previewURL(id) {
  try {
    return getURL(id);
  } catch {
    return '';
  }
}

/** @param {StoredImage} item */
function newItem(item) {
  const { id, type = 'misc' } = item;
  const wrapper = document.importNode(template, true).querySelector('li');
  wrapper.dataset.id = id;
  wrapper.dataset.type = type;

  const preview = wrapper.querySelector('.preview');
  preview.src = previewURL(id);
  preview.addEventListener('error', () => preview.classList.add('hidden'));

  const name = wrapper.querySelector('.name');
  function setName() {
    const value = getName(id) || '(blank)';
    name.textContent = value;
    wrapper.dataset.search = value;
  }
  setName();

  wrapper.querySelector('[data-tip="Rename"]').addEventListener('click', () => startRename(id, name, setName));
  wrapper.querySelector('[data-tip="Delete"]').addEventListener('click', () => confirmRemove(id));

  return wrapper;
}

function startRename(id, name, setName) {
  if (!name.isConnected) return;
  const field = document.createElement('input');
  field.type = 'text';
  field.className = 'rename';
  field.value = getName(id) ?? '';
  name.replaceWith(field);
  field.focus();
  field.select();

  let done = false;
  async function finish(commit) {
    if (done) return;
    done = true;
    const value = field.value.trim();
    field.replaceWith(name);
    if (commit && value) {
      await tryOrError(() => rename(id, value), 'Failed to rename the image');
    }
    setName();
  }

  field.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finish(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    }
  });
  field.addEventListener('blur', () => finish(true));
}
