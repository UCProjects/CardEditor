import { beforeAll, describe, expect, it, vi } from 'vitest';
import registryEvents from '../elements/registryEvents.js';
import settings, { Settings } from '../settings.js';
import EventEmitter from '../utils/EventEmitter.js';

const { store } = vi.hoisted(() => ({ store: new Map() }));

function makeElement({ id, type, name = id, content }) {
  const renderer = new EventEmitter();
  renderer.container = document.createElement('div');
  const el = new EventEmitter();
  Object.assign(el, {
    id,
    type,
    name,
    description: '',
    renderer: () => renderer,
    isSpell: () => false,
    toJSON: () => ({ id, type, name, content: el.content }),
  });
  if (type === 'group') {
    el.content = content ?? [];
    el.remove = (childId) => {
      const index = el.content.indexOf(childId);
      if (index !== -1) el.content.splice(index, 1);
    };
  }
  return el;
}

vi.mock('../tip/index.js', () => ({ close: vi.fn() }));
vi.mock('../UndercardEditor.js', () => ({ default: { addGroup: vi.fn(), save: vi.fn() } }));
vi.mock('../editor/editor.js', () => ({ default: { on: () => {}, open: vi.fn() } }));
vi.mock('../elements/registry.js', () => ({
  getAll: () => [...store.values()],
  init: (props) => makeElement(props),
  register: (el) => {
    store.set(el.id, el);
    registryEvents.emit('add', el);
  },
  remove: (el) => store.delete(el.id),
  save: vi.fn(),
}));

const root = () => document.querySelector('.archive [data-page="elements"] ul');
const row = (id) => root().querySelector(`li[data-id="${id}"]`);
const trashFolder = () => row('trash');
const trashList = () => trashFolder().querySelector('ul.extra');
const click = (id, name) => row(id).querySelector(`button[name="${name}"]`).click();
const key = (id) => `data:trash:${id}`;

function seed(id, type, { group, content } = {}) {
  localStorage.setItem(key(id), JSON.stringify({
    id,
    group,
    element: { type, name: id, content },
  }));
}

beforeAll(async () => {
  store.set('live', makeElement({ id: 'live', type: 'card' }));
  seed('lost', 'card');
  seed('box', 'group', { content: ['kept'] });
  seed('kept', 'card', { group: 'box' });

  settings.set(Settings.KeepTrash, true);
  const { load } = await import('./elements.js');
  load();
});

describe('persisted trash', () => {
  it('restores the trash folder on load', () => {
    expect(trashFolder().classList.contains('hidden')).toBe(false);
    expect(row('lost').parentElement).toBe(trashList());
    expect(row('lost').classList.contains('trashed')).toBe(true);
  });

  it('keeps a trashed child nested in its trashed group', () => {
    expect(row('box').parentElement).toBe(trashList());
    expect(row('kept').parentElement).toBe(row('box').querySelector('ul.extra'));
  });

  it('leaves live elements out of the trash', () => {
    expect(row('live').parentElement).toBe(root());
    expect(row('live').classList.contains('trashed')).toBe(false);
  });

  it('clears the key and re-registers when restored', () => {
    click('lost', 'restore');
    expect(row('lost').parentElement).toBe(root());
    expect(localStorage.getItem(key('lost'))).toBe(null);
    expect(store.has('lost')).toBe(true);
  });

  it('restores a group with its children', () => {
    click('box', 'restore');
    expect(row('box').parentElement).toBe(root());
    expect(row('kept').parentElement).toBe(row('box').querySelector('ul.extra'));
    expect(localStorage.getItem(key('box'))).toBe(null);
    expect(localStorage.getItem(key('kept'))).toBe(null);
  });

  it('writes a record when trashing, carrying the group', () => {
    click('kept', 'trash');
    const record = JSON.parse(localStorage.getItem(key('kept')));
    expect(record.id).toBe('kept');
    expect(record.group).toBe('box');
    expect(store.has('kept')).toBe(false);
  });

  it('clears the record when destroyed', () => {
    click('kept', 'destroy');
    expect(localStorage.getItem(key('kept'))).toBe(null);
    expect(row('kept')).toBe(null);
  });

  it('writes nothing once the setting is off', () => {
    settings.set(Settings.KeepTrash, false);
    click('live', 'trash');
    expect(row('live').parentElement).toBe(trashList());
    expect(localStorage.getItem(key('live'))).toBe(null);
  });
});

describe('trashing a group from the canvas', () => {
  it('trashes the cards inside it too', () => {
    const card = makeElement({ id: 'inner', type: 'card' });
    const group = makeElement({ id: 'crate', type: 'group', content: ['inner'] });
    [card, group].forEach((el) => {
      store.set(el.id, el);
      registryEvents.emit('add', el);
    });

    group.emit('delete');

    expect(store.has('crate')).toBe(false);
    expect(store.has('inner')).toBe(false);
    expect(row('inner').classList.contains('trashed')).toBe(true);
    expect(row('inner').parentElement).toBe(row('crate').querySelector('ul.extra'));
  });

  it('removes the cards for good when the group is destroyed', () => {
    click('crate', 'destroy');
    expect(row('crate')).toBe(null);
    expect(row('inner')).toBe(null);
    expect(store.has('inner')).toBe(false);
  });
});

it('never swallowed a handler error', () => {
  expect([...document.querySelectorAll('.simpletoast.error')].map((t) => t.textContent)).toEqual([]);
});
