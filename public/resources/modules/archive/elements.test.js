import { beforeAll, describe, expect, it, vi } from 'vitest';
import registryEvents from '../elements/registryEvents.js';
import settings, { Settings } from '../settings.js';
import EventEmitter from '../utils/EventEmitter.js';

const { store } = vi.hoisted(() => ({ store: new Map() }));

vi.mock('../tip/index.js', () => ({ close: vi.fn() }));
vi.mock('../UndercardEditor.js', () => ({ default: { addGroup: vi.fn() } }));
vi.mock('../editor/editor.js', () => ({ default: { on: () => {}, open: vi.fn() } }));
vi.mock('../elements/registry.js', () => ({
  getAll: () => [...store.values()],
  init: (props) => element(props),
  register: (el) => {
    store.set(el.id, el);
    registryEvents.emit('add', el);
  },
  remove: (el) => store.delete(el.id),
  save: vi.fn(),
}));

let copies = 0;

function element({ id, type, content }) {
  const el = new EventEmitter();
  const renderer = new EventEmitter();
  renderer.container = document.createElement('div');
  Object.assign(el, {
    id,
    type,
    name: id,
    description: '',
    renderer: () => renderer,
    isSpell: () => false,
    toJSON: () => ({ id, type, name: id, content: el.content }),
    duplicate() {
      copies += 1;
      return element({ id: `copy-${copies}`, type, content: el.content && [...el.content] });
    },
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

const root = () => document.querySelector('.archive [data-page="elements"] ul');
const row = (id) => root().querySelector(`li[data-id="${id}"]`);
const trashFolder = () => row('trash');
const trashList = () => trashFolder().querySelector('ul.extra');
const click = (id, name) => row(id).querySelector(`button[name="${name}"]`).click();
const extraOf = (id) => row(id).querySelector('ul.extra');
const trashKey = (id) => `data:trash:${id}`;
const dropOut = () => document.querySelector('.archive [data-page="elements"] .drop-out');
const hidden = (el) => el.classList.contains('hidden');

function fire(el, type, props = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, props);
  el.dispatchEvent(event);
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function dragStart(id) {
  const li = row(id);
  fire(li, 'dragstart', { dataTransfer: {} });
  await frame();
  return li;
}

async function drag(id, target) {
  const li = await dragStart(id);
  fire(target, 'dragover');
  const accepted = target.classList.contains('drag-over');
  if (accepted) fire(target, 'drop');
  fire(li, 'dragend');
  return accepted;
}

beforeAll(async () => {
  localStorage.setItem('data:trash:stale', JSON.stringify({
    id: 'stale',
    element: { type: 'card', name: 'stale' },
  }));
  store.set('card', element({ id: 'card', type: 'card' }));
  store.set('child', element({ id: 'child', type: 'card' }));
  store.set('group', element({ id: 'group', type: 'group', content: ['child'] }));
  store.set('other', element({ id: 'other', type: 'group', content: [] }));
  const { load } = await import('./elements.js');
  load();
});

describe('load', () => {
  it('keeps persisted trash for this session, then forgets it', () => {
    expect(row('stale').parentElement).toBe(trashList());
    expect(localStorage.getItem('data:trash:stale')).toBe(null);
    click('stale', 'destroy');
  });

  it('renders one row per element', () => {
    expect(root().querySelectorAll('li[data-id]')).toHaveLength(5);
  });

  it('nests children inside their group', () => {
    expect(row('child').parentElement).toBe(extraOf('group'));
  });

  it('hides an empty trash folder', () => {
    expect(trashFolder().classList.contains('hidden')).toBe(true);
  });
});

describe('trash', () => {
  it('moves the existing row instead of rendering a new one', () => {
    const li = row('card');
    click('card', 'trash');
    expect(row('card')).toBe(li);
    expect(li.parentElement).toBe(trashList());
    expect(li.classList.contains('trashed')).toBe(true);
  });

  it('reveals the trash folder', () => {
    expect(trashFolder().classList.contains('hidden')).toBe(false);
  });

  it('restores the same row to its original home', () => {
    const li = row('card');
    click('card', 'restore');
    expect(row('card')).toBe(li);
    expect(li.parentElement).toBe(root());
    expect(li.classList.contains('trashed')).toBe(false);
    expect(trashFolder().classList.contains('hidden')).toBe(true);
  });

  it('survives repeated cycles without duplicating rows', () => {
    const li = row('card');
    for (let i = 0; i < 3; i += 1) {
      click('card', 'trash');
      click('card', 'restore');
    }
    expect(root().querySelectorAll('li[data-id="card"]')).toHaveLength(1);
    expect(row('card')).toBe(li);
  });

  it('sends a lone child to the trash folder, not its group', () => {
    const child = row('child');
    click('child', 'trash');
    expect(row('child')).toBe(child);
    expect(child.parentElement).toBe(trashList());
    click('child', 'restore');
    expect(child.parentElement).toBe(extraOf('group'));
  });

  it('carries group children into the trash', () => {
    const child = row('child');
    click('group', 'trash');
    expect(row('group').parentElement).toBe(trashList());
    expect(row('child')).toBe(child);
    expect(child.classList.contains('trashed')).toBe(true);
    click('group', 'restore');
    expect(row('group').parentElement).toBe(root());
    expect(row('child')).toBe(child);
  });
});

describe('move', () => {
  it('drops a loose item into a group', async () => {
    const li = row('card');
    expect(await drag('card', row('group'))).toBe(true);
    expect(row('card')).toBe(li);
    expect(li.parentElement).toBe(extraOf('group'));
    expect(store.get('group').content).toContain('card');
  });

  it('expands the group it dropped into', () => {
    expect(extraOf('group').classList.contains('hidden')).toBe(false);
  });

  it('moves an item between groups', async () => {
    const li = row('card');
    expect(await drag('card', row('other'))).toBe(true);
    expect(row('card')).toBe(li);
    expect(li.parentElement).toBe(extraOf('other'));
    expect(store.get('group').content).not.toContain('card');
    expect(store.get('other').content).toContain('card');
  });

  it('rejects the group it already belongs to', async () => {
    expect(await drag('card', row('other'))).toBe(false);
  });

  it('rejects nesting a group inside a group', async () => {
    expect(await drag('group', row('other'))).toBe(false);
  });

  it('rejects a trashed group as a target', async () => {
    click('other', 'trash');
    expect(await drag('child', row('other'))).toBe(false);
    click('other', 'restore');
  });

  it('restores a trashed item into its new group', async () => {
    click('child', 'trash');
    expect(row('child').parentElement).toBe(trashList());
    expect(await drag('child', row('other'))).toBe(true);
    expect(row('child').parentElement).toBe(extraOf('other'));
    expect(row('child').classList.contains('trashed')).toBe(false);
    expect(trashFolder().classList.contains('hidden')).toBe(true);
  });
});

describe('leaving a group', () => {
  it('only offers the drop target while dragging a grouped item', async () => {
    expect(hidden(dropOut())).toBe(true);

    const loose = await dragStart('group');
    expect(hidden(dropOut())).toBe(true);
    fire(loose, 'dragend');

    const grouped = await dragStart('card');
    expect(hidden(dropOut())).toBe(false);
    fire(grouped, 'dragend');
    expect(hidden(dropOut())).toBe(true);
  });

  it('sits in the list below the groups', () => {
    expect(dropOut().parentElement).toBe(root());
    expect(dropOut().previousElementSibling.dataset.insert).toBe('groups');
  });

  it('moves the item back to the top level', async () => {
    const li = row('card');
    expect(await drag('card', dropOut())).toBe(true);
    expect(row('card')).toBe(li);
    expect(li.parentElement).toBe(root());
    expect(dropOut().nextElementSibling).toBe(li);
    expect(store.get('other').content).not.toContain('card');
  });

  it('no longer offers the target once it is loose', async () => {
    const li = await dragStart('card');
    expect(hidden(dropOut())).toBe(true);
    fire(li, 'dragend');
  });
});

describe('duplicate', () => {
  const fixture = ['card', 'child', 'group', 'other', 'trash'];
  const extras = () => [...root().querySelectorAll('li[data-id]')]
    .filter((li) => !fixture.includes(li.dataset.id));

  it('adds a copy under a new id at the top level', () => {
    click('card', 'duplicate');
    expect(extras()).toHaveLength(1);

    const [copy] = extras();
    expect(copy.dataset.id).not.toBe('card');
    expect(copy.parentElement).toBe(root());
    expect(store.has(copy.dataset.id)).toBe(true);

    click(copy.dataset.id, 'destroy');
  });

  it('puts a grouped copy in the group, and in its content', () => {
    click('child', 'duplicate');
    expect(extras()).toHaveLength(1);

    const [copy] = extras();
    expect(copy.parentElement).toBe(extraOf('other'));
    expect(store.get('other').content).toContain(copy.dataset.id);
  });
});

describe('enabling persistence later', () => {
  it('backfills whatever is already in the trash', () => {
    click('card', 'trash');
    expect(localStorage.getItem('data:trash:card')).toBe(null);

    settings.set(Settings.KeepTrash, true);

    const stored = JSON.parse(localStorage.getItem('data:trash:card'));
    expect(stored.id).toBe('card');
    expect(row('card').parentElement).toBe(trashList());
  });
});

describe('toggling persistence repeatedly', () => {
  it('only writes while enabled, and catches up on re-enable', () => {
    settings.set(Settings.KeepTrash, false);
    click('child', 'trash');
    expect(localStorage.getItem(trashKey('child'))).toBe(null);

    settings.set(Settings.KeepTrash, true);
    expect(JSON.parse(localStorage.getItem(trashKey('child'))).group).toBe('other');

    settings.set(Settings.KeepTrash, false);
    settings.set(Settings.KeepTrash, true);
    expect(JSON.parse(localStorage.getItem(trashKey('child'))).id).toBe('child');
  });

  it('does not resurrect something restored while disabled', () => {
    settings.set(Settings.KeepTrash, false);
    click('child', 'restore');
    expect(localStorage.getItem(trashKey('child'))).toBe(null);

    settings.set(Settings.KeepTrash, true);
    expect(localStorage.getItem(trashKey('child'))).toBe(null);
    expect(row('child').parentElement).toBe(extraOf('other'));
  });
});

describe('destroy', () => {
  it('re-hides the trash folder once the last entry is gone', () => {
    click('card', 'trash');
    expect(trashFolder().classList.contains('hidden')).toBe(false);
    click('card', 'destroy');
    expect(row('card')).toBe(null);
    expect(trashFolder().classList.contains('hidden')).toBe(true);
  });
});

it('never swallowed a handler error', () => {
  expect([...document.querySelectorAll('#breadbox .toast.error')].map((t) => t.textContent)).toEqual([]);
});
