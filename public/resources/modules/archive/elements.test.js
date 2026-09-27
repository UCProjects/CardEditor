import { beforeAll, describe, expect, it, vi } from 'vitest';
import EventEmitter from '../utils/EventEmitter.js';

const { store } = vi.hoisted(() => ({ store: new Map() }));

vi.mock('../UndercardEditor.js', () => ({ default: { addGroup: vi.fn() } }));
vi.mock('../editor/editor.js', () => ({ default: { on: () => {}, open: vi.fn() } }));
vi.mock('../elements/registry.js', () => ({
  getAll: () => [...store.values()],
  register: (el) => store.set(el.id, el),
  remove: (el) => store.delete(el.id),
  save: vi.fn(),
}));

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

beforeAll(async () => {
  ['card', 'group', 'child'].forEach((id) => store.set(id, element({
    id,
    type: id === 'group' ? 'group' : 'card',
    content: id === 'group' ? ['child'] : undefined,
  })));
  const { load } = await import('./elements.js');
  load();
});

describe('load', () => {
  it('renders one row per element', () => {
    expect(root().querySelectorAll('li[data-id]')).toHaveLength(4);
  });

  it('nests children inside their group', () => {
    expect(row('child').parentElement).toBe(row('group').querySelector('ul.extra'));
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

describe('destroy', () => {
  it('re-hides the trash folder once the last entry is gone', () => {
    click('card', 'trash');
    expect(trashFolder().classList.contains('hidden')).toBe(false);
    click('card', 'destroy');
    expect(row('card')).toBe(null);
    expect(trashFolder().classList.contains('hidden')).toBe(true);
  });
});
