import { getAll, register, remove, save } from '../elements/registry.js';
import events from '../elements/registryEvents.js';
import { Elements } from '../elements/types.js';
import { close as closeTip } from '../tip/index.js';
import { removeClass } from '../utils/funcs.js';
import { bindFilter, matches } from './filter.js';
import Item from './Item.js';
import App from '../UndercardEditor.js';
import editor from '../editor/editor.js';

const Trash = 'trashFolder';

/** @type {HTMLDivElement} */
const page = document.querySelector('.archive div[data-page="elements"]');
const empty = page.querySelector('div');
/**
 * @type {{
 *  groups: HTMLLIElement;
 *  items: HTMLLIElement;
 *  trash: HTMLUListElement;
 * }}
 */
const list = {
  groups: page.querySelector('[data-insert="groups"]'),
  items: page.querySelector('[data-insert="items"]'),
  trash: undefined,
};
/** @type {HTMLTemplateElement} */
const listItem = document.getElementById('elementItem');
/** @type {HTMLInputElement} */
const filterInput = page.querySelector('input[name="filter"]');

/** @type {Map<string, Item>} */
const items = new Map();
/** @type {Map<string, Item>} */
const groups = new Map();
/** @type {Set<Item>} */
const trashed = new Set();

/**
 * @typedef {{
 *  li: HTMLLIElement;
 *  extra: HTMLUListElement;
 *  collapse: () => void;
 * }} Row
 */

/** @type {WeakMap<Item, Row>} */
const rows = new WeakMap();

class TrashItem extends Item {
  constructor() {
    super({
      id: 'trash',
      name: 'Trash',
      type: Trash,
      on() { return this; },
    });
  }

  isActive() {
    return false;
  }
}

const trashRef = new TrashItem();

let dragSrc;

function add(el) {
  const item = new Item(el);
  const isGroup = el.type === Elements.Group;
  const map = isGroup ? groups : items;
  map.set(item.id, item);

  item.on('archived', () => {
    if (item.group && !groups.get(item.group)?.element.content.includes(item.id)) {
      item.group = undefined;
    }
    place(item);
  });
  item.on('restore', () => {
    if (!item.trashed) return;
    register(item.element);
    save(item.element);
    item.trashed = false;
    trashed.delete(item);
    place(item);
    trashRef.emit('refresh');
  });
  item.on('trash', () => {
    if (item.trashed) return;
    remove(item.element);
    item.trashed = true;
    trashed.add(item);
    place(item);
    trashRef.emit('refresh');
  });

  if (isGroup) {
    item.on('drop', (i) => {
      item.element.renderer().emit('drop', i.element);
      save(item.element);
      i.emit('dropped');
      i.group = item.id;
    });
    initDrop(item.element.renderer().container);
  }

  return item;
}

events.on('add', (element) => {
  if (element.type === Elements.Group ? groups.has(element.id) : items.has(element.id)) return;
  const item = add(element);
  if (item.type !== Elements.Group) {
    item.group = element.renderer().container.closest('.element.group').dataset.id;
  }
}).on('remove', (element) => {
  // TODO this is technically a centralized archive/trash location
});

export function load() {
  getAll().forEach(add);

  groups.forEach((group) => forEach(group, (child) => {
    child.group = group.id;
  }));

  initTrash();

  groups.forEach((group) => place(group));

  items.forEach((item) => place(item));

  const app = document.getElementById('app');
  initDrop(app, true);

  bindFilter(filterInput, applyFilter);

  refreshEmptyMessage();
}

/**
 * @param {Item} item
 * @returns {Row}
 */
function rowOf(item) {
  let row = rows.get(item);
  if (!row) {
    row = render(item);
    rows.set(item, row);
  }
  return row;
}

/** @param {Item} item */
function place(item) {
  if (item.isActive()) return;
  const { li } = rowOf(item);
  const group = item.group ? groups.get(item.group) : undefined;
  if (item.trashed && !group?.trashed) list.trash.append(li);
  else if (group) rowOf(group).extra.append(li);
  else if (item.type === Elements.Group) list.groups.before(li);
  else list.items.before(li);
  if (item.type === Elements.Group) forEach(item, place);
  item.emit('refresh');
  refreshEmptyMessage();
}

/**
 * @param {Item} item
 * @returns {Row}
 */
function render(item) {
  const fragment = document.importNode(listItem.content, true);
  /** @type {HTMLLIElement} */
  const li = fragment.querySelector('li');
  /** @type {HTMLUListElement} */
  const extra = fragment.querySelector('ul.extra');
  const isContainer = item.type === Elements.Group || item.type === Trash;

  li.dataset.id = item.id;
  li.dataset.type = item.type;
  li.draggable = item.type !== Trash;
  if (item.type === Elements.Card && item.element.isSpell()) li.dataset.spell = '';

  const name = li.querySelector('.name');
  function setName() {
    name.dataset.tip = item.name;
    name.textContent = item.name || '(blank)';
    li.dataset.search = [item.name, item.element.description].filter(Boolean).join(' ');
  }
  setName();

  if (!isContainer) extra.remove();
  const collapse = isContainer ? initExpand(li, extra) : () => {};

  if (item !== trashRef) {
    const EOL = new AbortController();
    const options = { signal: EOL.signal };
    function discard() {
      li.remove();
      rows.delete(item);
      EOL.abort();
      refreshEmptyMessage();
    }
    item.on('refresh', () => {
      li.classList.toggle('hidden', item.isActive());
      li.classList.toggle('trashed', item.trashed);
    }, options);
    item.on('update', setName, options);
    item.on('destroy', () => {
      (item.type === Elements.Group ? groups : items).delete(item.id);
      trashed.delete(item);
      discard();
      trashRef.emit('refresh');
    }, options);
    item.on('dropped', () => {
      const group = item.group ? groups.get(item.group) : undefined;
      if (group) {
        group.element.remove(item.id);
        save(group.element);
      }
      discard();
    }, options);
  }

  initButtons(li, item);
  initDrag(li, item);
  item.emit('refresh');
  return { li, extra, collapse };
}

/**
 * @param {HTMLLIElement} li
 * @param {HTMLUListElement} extra
 * @returns {() => void}
 */
function initExpand(li, extra) {
  const buttons = [...li.querySelectorAll('[data-action="expand"]')].map((button) => ({
    button,
    closed: button.textContent,
    open: button.dataset.open ?? button.textContent,
  }));

  function setCollapsed(collapsed) {
    extra.classList.toggle('hidden', collapsed);
    buttons.forEach(({ button, closed, open }) => {
      button.classList.toggle('fill', collapsed);
      button.textContent = collapsed ? closed : open;
    });
  }

  buttons.forEach(({ button }) => button.addEventListener('click', () => {
    setCollapsed(!extra.classList.contains('hidden'));
  }));

  return () => setCollapsed(true);
}

/**
 * @param {Item} item
 * @param {string} event
 */
function cascade(item, event) {
  if (item.type === Elements.Group) forEach(item, (child) => child.emit(event));
  item.emit(event);
}

/** @type {Record<string, (item: Item) => void>} */
const actions = {
  edit(item) {
    const editController = new AbortController();
    editor.on('save', () => {
      item.emit('update');
    }, { signal: editController.signal });
    editor.on('close', () => {
      editController.abort();
      document.querySelector('.archive').showPopover();
    }, { signal: editController.signal });
    editor.open(item.element.renderer());
  },
  trash: (item) => cascade(item, 'trash'),
  restore: (item) => cascade(item, 'restore'),
  destroy: (item) => cascade(item, 'destroy'),
  restoreAll: () => getTrash().forEach((i) => i.emit('restore')),
  destroyAll: () => getTrash().forEach((i) => i.emit('destroy')),
};

/**
 * @param {HTMLElement} container
 * @param {Item} item
 */
function initButtons(container, item) {
  container.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => actions[button.name]?.(item));
  });
}

/**
 * @param {HTMLElement} container
 * @param {Item} item
 */
function initDrag(container, item) {
  container.addEventListener('dragstart', (e) => {
    dragSrc = container;
    container.classList.add('dragging');
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    closeTip();
  });

  container.addEventListener('dragend', () => {
    container.classList.remove('dragging');
    removeClass('drag-over');
    dragSrc = undefined;
  });

  if (item.element.type !== Elements.Group) return;

  // TODO Allow moving between groups?
}

/** @param {HTMLElement} container */
function initDrop(container, allowGroups = false) {
  container.addEventListener('dragover', (e) => {
    if (!dragSrc) return;
    const isGroup = dragSrc.dataset.type === Elements.Group;
    if (allowGroups !== isGroup) return;
    e.preventDefault();
    e.stopPropagation();
    removeClass('drag-over');
    container.classList.add('drag-over');
  });
  container.addEventListener('dragleave', () => {
    container.classList.remove('drag-over');
  });
  container.addEventListener('drop', (e) => {
    e.stopPropagation();
    const { id, type } = dragSrc.dataset;
    const isGroup = type === Elements.Group;
    const item = isGroup ? groups.get(id) : items.get(id);
    if (item.trashed) cascade(item, 'restore');
    if (isGroup) {
      const renderer = item.element.renderer();
      App.addGroup(renderer);
      item.emit('dropped');
      renderer.emit('loaded');
    } else {
      const groupId = container.dataset.id;
      const group = groups.get(groupId);
      if (!group) {
        console.error(`Group not found ${groupId}`);
        return;
      }
      group.emit('drop', item);
    }
  });
}

function initTrash() {
  const { li, extra, collapse } = rowOf(trashRef);
  list.trash = extra;

  trashRef.on('refresh', () => {
    const hidden = !trashed.size;
    li.classList.toggle('hidden', hidden);
    if (hidden) collapse();
    refreshEmptyMessage();
  }).emit('refresh');

  list.items.after(li);
}

function getTrash() {
  return [...trashed].sort(childrenFirst);
}

/**
 * @param {Item} a
 * @param {Item} b
 */
function childrenFirst(a, b) {
  return Number(a.type === Elements.Group) - Number(b.type === Elements.Group);
}

function forEach(group, callback) {
  group.element.content.forEach((id) => {
    const item = items.get(id);
    if (!item) return;
    callback(item);
  });
}

function applyFilter(query) {
  const root = list.groups.parentElement;
  root.classList.toggle('filtering', !!query);
  root.querySelectorAll(':scope > li[data-id]').forEach((row) => {
    const self = matches(row, query);
    let child = false;
    row.querySelectorAll(':scope > ul.extra > li[data-id]').forEach((nested) => {
      const show = self || matches(nested, query);
      nested.classList.toggle('filtered', !show);
      if (show && query) child = true;
    });
    row.classList.toggle('filtered', !!query && !self && !child);
  });
  refreshEmptyMessage();
}

function refreshEmptyMessage() {
  const root = list.groups.parentElement;
  const filtering = root.classList.contains('filtering');
  empty.textContent = filtering ? 'No matches' : 'Empty, archive something';
  empty.classList.toggle('hidden', !!root.querySelector(':scope > li:not(.hidden, .filtered)'));
}
