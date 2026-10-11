import { getAll, init, register, remove, save } from '../elements/registry.js';
import settings, { Settings } from '../settings.js';
import { clearTrashed, getTrashed, removeTrashed, setTrashed } from '../utils/storage.js';
import events from '../elements/registryEvents.js';
import { Elements } from '../elements/types.js';
import { close as closeTip } from '../tip/index.js';
import { removeClass } from '../utils/funcs.js';
import { bindFilter, filterRows } from './filter.js';
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
/** @type {HTMLDivElement} */
const dropOut = page.querySelector('.drop-out');

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
 *  setCollapsed: (collapsed: boolean) => void;
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
    removeTrashed(item.id);
    item.trashed = false;
    trashed.delete(item);
    place(item);
    trashRef.emit('refresh');
  });
  item.on('trash', () => {
    if (item.trashed) return;
    if (isGroup) forEach(item, (child) => child.emit('trash'));
    if (settings.enabled(Settings.KeepTrash)) setTrashed(record(item));
    remove(item.element);
    item.trashed = true;
    trashed.add(item);
    place(item);
    trashRef.emit('refresh');
  });

  if (isGroup) {
    item.on('drop', (i) => {
      item.element.renderer().emit('drop', i.element);
      item.element.renderer().emit('save');
      i.emit('dropped');
      i.group = item.id;
    });
    initDrop(item.element.renderer().container, {
      accepts: (i) => i.type !== Elements.Group,
      drop: (i) => item.emit('drop', i),
    });
  }

  return item;
}

events.on('add', (element) => {
  if (element.type === Elements.Group ? groups.has(element.id) : items.has(element.id)) return;
  const item = add(element);
  if (item.type !== Elements.Group) {
    item.group = element.renderer().container.closest('.element.group')?.dataset.id;
  }
});

/**
 * @param {Item} item
 * @returns {import('../utils/storage.js').TrashRecord}
 */
function record(item) {
  const element = item.element.toJSON();
  if (item.element.content) element.content = [...item.element.content];
  return { id: item.id, group: item.group, element };
}

function loadTrash() {
  getTrashed().forEach(({ id, group, element }) => {
    const item = add(init({ ...element, id }));
    item.group = group;
    item.trashed = true;
    trashed.add(item);
  });
  if (!settings.enabled(Settings.KeepTrash)) clearTrashed();
}

export function load() {
  getAll().forEach(add);

  loadTrash();

  settings.on(Settings.KeepTrash, (enabled) => {
    if (enabled) trashed.forEach((item) => setTrashed(record(item)));
  });

  groups.forEach((group) => forEach(group, (child) => {
    child.group = group.id;
  }));

  initTrash();

  groups.forEach((group) => place(group));

  items.forEach((item) => place(item));

  initDrop(dropOut, {
    accepts: leavesGroup,
    drop: (item) => move(item, undefined),
  });

  initDrop(document.getElementById('app'), {
    accepts: (item) => item.type === Elements.Group,
    drop: (item) => {
      const renderer = item.element.renderer();
      App.addGroup(renderer);
      App.save();
      item.emit('dropped');
      renderer.emit('loaded');
    },
  });

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
  if (item.type === Elements.Group) {
    forEach(item, (child) => {
      child.group = item.id;
      place(child);
    });
  }
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
  const setCollapsed = isContainer ? initExpand(li, extra) : () => {};

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
      removeTrashed(item.id);
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
  initDrag(li);
  if (item.type === Elements.Group) {
    initDrop(li, {
      accepts: (i) => i.type !== Elements.Group && i.group !== item.id && !item.trashed,
      drop: (i) => move(i, item),
    });
  }
  item.emit('refresh');
  return { li, extra, setCollapsed };
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

  return setCollapsed;
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
  duplicate(item) {
    const copy = item.element.duplicate();
    const created = add(copy);
    created.group = item.group;
    register(copy);
    save(copy);
    const group = item.group ? groups.get(item.group) : undefined;
    if (group) {
      group.element.content.push(copy.id);
      save(group.element);
    }
    place(created);
  },
  trash: (item) => item.emit('trash'),
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

/** @param {HTMLElement} container */
function initDrag(container) {
  container.addEventListener('dragstart', (e) => {
    dragSrc = container;
    container.classList.add('dragging');
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    closeTip();
    requestAnimationFrame(refreshDropOut);
  });

  container.addEventListener('dragend', () => {
    container.classList.remove('dragging');
    removeClass('drag-over');
    dragSrc = undefined;
    refreshDropOut();
  });
}

function dragged() {
  if (!dragSrc) return undefined;
  const { id, type } = dragSrc.dataset;
  return (type === Elements.Group ? groups : items).get(id);
}

/** @param {Item} item */
function leavesGroup(item) {
  return item.type !== Elements.Group && !!item.group;
}

function refreshDropOut() {
  const item = dragged();
  dropOut.classList.toggle('hidden', !item || !leavesGroup(item));
}

/**
 * @param {HTMLElement} container
 * @param {{
 *  accepts: (item: Item) => boolean;
 *  drop: (item: Item) => void;
 * }} target
 */
function initDrop(container, { accepts, drop }) {
  function accepted() {
    const item = dragged();
    return item && accepts(item) ? item : undefined;
  }

  container.addEventListener('dragover', (e) => {
    if (!accepted()) return;
    e.preventDefault();
    e.stopPropagation();
    removeClass('drag-over');
    container.classList.add('drag-over');
  });
  container.addEventListener('dragleave', () => {
    container.classList.remove('drag-over');
  });
  container.addEventListener('drop', (e) => {
    const item = accepted();
    if (!item) return;
    e.stopPropagation();
    if (item.trashed) cascade(item, 'restore');
    drop(item);
  });
}

/**
 * @param {Item} item
 * @param {Item} group
 */
function move(item, group) {
  const from = item.group ? groups.get(item.group) : undefined;
  if (from) {
    from.element.remove(item.id);
    save(from.element);
  }
  if (group) {
    group.element.content.push(item.id);
    save(group.element);
  }
  item.group = group?.id;
  place(item);
  if (group) rowOf(group).setCollapsed(false);
}

function initTrash() {
  const { li, extra, setCollapsed } = rowOf(trashRef);
  list.trash = extra;

  trashRef.on('refresh', () => {
    const hidden = !trashed.size;
    li.classList.toggle('hidden', hidden);
    if (hidden) setCollapsed(true);
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
  filterRows(list.groups.parentElement, query);
  refreshEmptyMessage();
}

function refreshEmptyMessage() {
  const root = list.groups.parentElement;
  const filtering = root.classList.contains('filtering');
  empty.textContent = filtering ? 'No matches' : 'Empty, archive something';
  empty.classList.toggle('hidden', !!root.querySelector(':scope > li:not(.hidden, .filtered, .drop-out)'));
}
