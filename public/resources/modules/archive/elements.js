import { getAll, register, remove, save } from '../elements/registry.js';
import events from '../elements/registryEvents.js';
import { Elements } from '../elements/types.js';
import { close as closeTip } from '../tip/index.js';
import { contains } from '../utils/array.js';
import { removeClass } from '../utils/funcs.js';
import Item from './Item.js';
import App from '../UndercardEditor.js';
import editor from '../editor/editor.js';

/** @type {HTMLDivElement} */
const page = document.querySelector('.archive div[data-page="elements"]');
const empty = page.querySelector('div');
/**
 * @type {{
 *  groups: HTMLLIElement;
 *  items: HTMLLIElement;
 *  trash: HTMLLIElement;
 * }}
 */
const list = {
  groups: page.querySelector('[data-insert="groups"]'),
  items: page.querySelector('[data-insert="items"]'),
  trash: undefined,
};
/** @type {HTMLTemplateElement} */
const listItem = document.getElementById('elementItem');

/** @type {Map<string, Item>} */
const items = new Map();
/** @type {Map<string, Item>} */
const groups = new Map();

const trashRef = new Item({
  id: 'trash',
  name: 'Trash',
  type: 'trashFolder',
  on() { return this; },
  renderer() { return { container: {} }; }
});

let dragSrc;

// TODO search
function add(el) {
  const item = new Item(el);
  const isGroup = el.type === Elements.Group;
  const map = isGroup ? groups : items;
  map.set(item.id, item);

  item.on('archived', () => {
    if (item.group && !groups.get(item.group)?.element.content.includes(item.id)) {
      item.group = undefined;
    }
    addItem(item);
  });
  item.on('restore', () => {
    register(item.element);
    save(item.element);
    item.trashed = false;
    item.emit('refresh');
    trashRef.emit('refresh');
  });
  item.on('trash', () => {
    if (item.trashed) return;
    remove(item);
    item.trashed = true;
    addItem(item, true);
    item.emit('refresh');
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

  groups.forEach(i => addItem(i));

  items.forEach(i => addItem(i));

  initTrash();

  const app = document.getElementById('app');
  initDrop(app, true);

  page.addEventListener('dragleave', (e) => {
    if (!dragSrc || e.fromElement !== page) return;
    // TODO render ghost element
  });
  page.addEventListener('dragenter', (e) => {
    if (!dragSrc || e.fromElement !== page) return;
    // TODO switch back to original element
  });

  refreshEmptyMessage();
}

/** @param {Item} item  */
function render(item, {
  inGroup = false,
  inTrash = false,
} = {}) {
  const container = document.importNode(listItem.content, true);
  const isTrashFolder = item.type === 'trashFolder';
  const li = container.querySelector('li');
  li.draggable = !isTrashFolder;
  container.querySelectorAll('[data-type]').forEach((el) => {
    const types = el.dataset.type.split(',');
    const needle = [item.type];
    if (!isTrashFolder) needle.push(inTrash || item.trashed ? 'trash' : 'normal');
    if (!contains(types, needle)) el.remove();
  });
  const name = container.querySelector('.name');
  function setName() {
    name.dataset.tip = item.name;
    name.textContent = item.name || '(blank)';
  }
  setName();
  if (!isTrashFolder) {
    const EOL = new AbortController();
    item.on('refresh', () => li.classList.toggle('hidden', !inTrash && !inGroup && item.isHidden()));
    item.on('destroy', () => {
      const map = item.type === Elements.Group ? groups : items;
      map.delete(item.id);
      li.remove();
      EOL.abort();
      refreshEmptyMessage();
    });
    item.on('dropped', () => {
      if (item.group) {
        const group = groups.get(item.group);
        if (!group) return;
        group.element.remove(item.id);
        save(group);
      }
      li.remove();
      EOL.abort();
      refreshEmptyMessage();
    });
    item.on('update', () => {
      if (!li.isConnected) return true;
      setName();
      return false;
    }, { signal: EOL.signal });
  }
  initButtons(li, item);
  initDrag(li, item);
  li.dataset.id = item.id;
  li.dataset.type = item.element.type;
  if (item.element.type === Elements.Card && item.element.isSpell()) li.dataset.spell = '';
  item.emit('refresh');
  return container;
}

/** @param {Item} group  */
function addGroup(group, trash = false) {
  const container = render(group, { inTrash: trash });
  const extra = container.querySelector('ul.extra');
  const button = container.querySelector('[data-action="expand"]');
  button.addEventListener('click', () => {
    extra.classList.toggle('hidden');
    button.textContent = button.textContent === 'folder' ? 'folder_open' : 'folder';
  });
  function addChild(item) {
    item.group = group.id;
    extra.appendChild(render(item, { inGroup: true, inTrash: trash }));
  }
  forEach(group, addChild);
  if (!trash) group.on('addChild', (id) => addChild(items.get(id)));
  if (trash) list.trash.append(container);
  else list.groups.before(container);
}

/** @param {Item} item  */
function addItem(item, trash = false) {
  if (item.isActive()) return;
  if (item.type === Elements.Group) {
    addGroup(item, trash);
  } else if (trash) {
    if (groups.get(item.group)?.trashed) return;
    list.trash.append(render(item, { inTrash: true }));
  } else if (!item.group) { // TODO or if group trashed
    list.items.before(render(item));
  }
  refreshEmptyMessage();
}

/**
 * @param {HTMLElement} container
 * @param {Item} item
 */
function initButtons(container, item) {
  const isGroup = item.type === Elements.Group;
  const isTrashFolder = item.type === 'trashFolder';
  container.querySelectorAll('button').forEach((button) => {
    if (button.name === 'edit') {
      button.addEventListener('click', () => {
        const editController = new AbortController();
        editor.on('save', () => {
          item.emit('update');
        }, { signal: editController.signal });
        editor.on('close', () => {
          editController.abort();
          document.querySelector('.archive').showPopover();
        }, { signal: editController.signal });
        editor.open(item.element.renderer());
      });
    } else if (button.name === 'delete') {
      button.addEventListener('click', () => {
        /** @param {Item} i  */
        function destroy(i) {
          i.emit('destroy');
        }
        /** @param {Item} i  */
        function mark(i) {
          i.emit('trash');
        }
        if (isTrashFolder) {
          getTrash().forEach(destroy);
          trashRef.emit('refresh');
        } else if (item.trashed) {
          destroy(item);
          if (isGroup) forEach(item, destroy);
        } else {
          // if (item.group) item.group = undefined; // TODO is this needed?
          mark(item);
          if (isGroup) forEach(item, mark);
        }
      });
    } else if (button.name === 'restore') {
      button.addEventListener('click', () => {
        /** @param {Item} i  */
        function mark(i) {
          i.emit('restore');
          if (!isTrashFolder) container.remove();
        }
        if (isTrashFolder) {
          // Items must be restored first
          getTrash().reverse().forEach(mark);
          list.trash.innerHTML = '';
        } else {
          if (isGroup) forEach(item, mark);
          mark(item);
        }
      });
    }
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
    if (item.trashed) item.emit('restore');
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
  const container = render(trashRef);
  const li = container.querySelector('li');
  const extra = container.querySelector('ul.extra');
  const button = container.querySelector('[data-action="expand"]');
  button.addEventListener('click', () => {
    extra.classList.toggle('hidden');
    button.classList.toggle('fill');
  });

  trashRef.on('refresh', () => {
    const hidden = !getTrash().length;
    li.classList.toggle('hidden', hidden);
    if (hidden) {
      extra.classList.add('hidden');
      button.classList.add('fill');
    }
    refreshEmptyMessage();
  }).emit('refresh');

  list.items.after(container);
  list.trash = extra;
}

function getTrash() {
  return [
    ...groups.values(),
    ...items.values(),
  ].filter((i) => i.trashed);
}

function forEach(group, callback) {
  group.element.content.forEach((id) => {
    const item = items.get(id);
    if (!item) return;
    callback(item);
  });
}

function refreshEmptyMessage() {
  empty.classList.toggle('hidden', !!list.groups.parentElement.querySelector(':scope > li:not(.hidden)'));
}
