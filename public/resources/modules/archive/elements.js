import { events, getAll, register, remove, save } from '../elements/registry.js';
import { Elements } from '../elements/types.js';
import { contains } from '../utils/array.js';
import { removeClass } from '../utils/funcs.js';
import Item from './Item.js';

/** @type {HTMLDivElement} */
const page = document.querySelector('.archive div[data-page="elements"]');
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

export function load() {
  function add(el) {
    const item = new Item(el);
    const map = el.type === Elements.Group ? groups : items;
    map.set(item.id, item);

    item.on('archived', () => {
      if (item.group && !groups.get(item.group)?.element.content.includes(item.id)) {
        item.group = undefined;
      }
      item.emit('refresh');
    });
    item.on('restore', () => {
      register(item.element);
      save(item.id);
      item.trashed = false;
      item.emit('refresh');
      trashRef.emit('refresh');
    });
    item.on('trash', () => {
      if (item.trashed) return;
      remove(item.id);
      item.trashed = true;
      item.emit('refresh');
      addItem(item, true);
      trashRef.emit('refresh');
    });

    // TODO group containers allow drop

    return item;
  }

  getAll().forEach(add);

  groups.forEach(i => addGroup(i));

  items.forEach(i => addItem(i));

  initTrash();

  events.on('add', (element) => {
    if (element.type === Elements.Group ? groups.has(element.id) : items.has(element.id)) return;
    const item = add(element);
    if (item.type !== Elements.Group) {
      item.group = element.renderer().container.closest('.element.group').dataset.id;
    }
    addItem(item);
  });

  const app = document.getElementById('app');
  app.addEventListener('dragover', (e) => {
    if (!dragSrc || dragSrc.dataset.type !== Elements.Group) return;
    e.preventDefault();
    removeClass('drag-over');
    app.classList.add('drag-over');
  });
  app.addEventListener('dragleave', () => {
    app.classList.remove('drag-over');
  });
  app.addEventListener('drop', () => {
    // TODO Add to page (group only)
  });

  page.addEventListener('dragleave', () => {
    if (!dragSrc) return;
    // TODO render ghost element
  });
  page.addEventListener('dragenter', () => {
    if (!dragSrc) return;
    // TODO switch back to original element
  });
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
  if (!isTrashFolder) {
    item.on('refresh', () => li.classList.toggle('hidden', !inTrash && !inGroup && item.isHidden()));
    item.on('destroy', () => {
      const map = item.type === Elements.Group ? groups : items;
      map.delete(item.id);
      li.remove();
    });
  }
  container.querySelectorAll('[data-type]').forEach((el) => {
    const types = el.dataset.type.split(',');
    const needle = [
      item.type,
      isTrashFolder || inTrash || item.trashed ? 'trash' : 'normal'
    ];
    if (!contains(types, needle)) el.remove();
  });
  const name = container.querySelector('.name');
  name.dataset.tip = item.name;
  name.textContent = item.name || '(blank)';
  initButtons(li, item);
  initDrag(li, item);
  li.dataset.id = item.id;
  li.dataset.type = item.element.type;
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
  if (item.type === Elements.Group) {
    addGroup(item, trash);
  } else if (trash) {
    if (groups.get(item.group)?.trashed) return;
    list.trash.append(render(item, { inTrash: true }));
  } else {
    list.items.before(render(item));
  }
}

/**
 * @param {HTMLElement} container
 * @param {Item} item
 */
function initButtons(container, item) {
  const isGroup = item.type === Elements.Group;
  const isTrashFolder = item.type === 'trashFolder';
  const name = container.querySelector('.name');
  container.querySelectorAll('button').forEach((button) => {
    if (button.name === 'edit') {
      const input = document.createElement('input');
      input.type = 'text';
      input.classList.add('stretch');
      function update() {
        const value = input.value.trim();
        if (!value || value === item.name) {
          cancel();
          return;
        }
        item.name = value;
        input.setSelectionRange(0, 0);
        name.textContent = value;
        name.dataset.tip = value;
        save(item.id);
      }
      function cancel() {
        input.setSelectionRange(0, 0);
        name.textContent = item.name || '(blank)';
        name.dataset.tip = item.name;
      }
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') update();
        if (e.key === 'Escape') cancel();
        e.stopPropagation();
      });
      input.addEventListener('blur', update);
      button.addEventListener('click', () => {
        input.value = item.name;
        name.replaceChildren(input); // TODO Maybe do a modal?
        delete name.dataset.tip;
        input.focus();
        input.select();
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
          // if (item.group) item.group = undefined; // TODO
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
  });

  container.addEventListener('dragend', () => {
    container.classList.remove('dragging');
    removeClass('drag-over');
    dragSrc = undefined;
  });

  if (item.element.type !== Elements.Group) return;

  // Allow moving to/between groups?
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
