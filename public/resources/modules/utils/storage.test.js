import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function load() {
  vi.resetModules();
  return import('./storage.js');
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('reading and writing', () => {
  it('round trips the group list, colors and settings', async () => {
    const storage = await load();
    storage.setGroups(['a', 'b']);
    storage.setColors(['ff0000']);
    storage.setSettings(['keepTrash']);
    expect(storage.getGroups()).toEqual(['a', 'b']);
    expect(storage.getColors()).toEqual(['ff0000']);
    expect(storage.getSettings()).toEqual(['keepTrash']);
  });

  it('falls back when nothing is stored', async () => {
    const storage = await load();
    expect(storage.getGroups()).toEqual([]);
    expect(storage.getColors()).toEqual([]);
    expect(storage.getSettings()).toEqual([]);
    expect(storage.getElement('missing')).toBeUndefined();
    expect(storage.getVersion()).toBeUndefined();
  });

  it('keeps zero but drops empty values when storing an element', async () => {
    const storage = await load();
    storage.setElement('card', { name: '  Name ', attack: 0, description: '  ', effects: [] });
    expect(storage.getElement('card')).toEqual({ name: 'Name', attack: 0 });
  });

  it('removes an element', async () => {
    const storage = await load();
    storage.setElement('card', { name: 'Name' });
    storage.removeElement('card');
    expect(storage.getElement('card')).toBeUndefined();
  });
});

describe('corrupt entries', () => {
  it('moves unreadable data aside and returns the fallback', async () => {
    const storage = await load();
    localStorage.setItem('app:groups', '{not json');
    expect(storage.getGroups()).toEqual([]);
    expect(localStorage.getItem('app:groups')).toBe(null);
    const [target] = [...storage.getCorrupt()];
    expect(target).toMatch(/^app:corrupt:app:groups:\d+$/);
    expect(localStorage.getItem(target)).toBe('{not json');
  });

  it('keeps quarantined entries out of the data keys', async () => {
    const storage = await load();
    localStorage.setItem('data:el:broken', '{nope');
    expect(storage.getElement('broken')).toBeUndefined();
    expect([...storage.getKeys()]).toEqual([]);
    expect([...storage.getCorrupt()]).toHaveLength(1);
  });

  it('clears only the quarantined entries', async () => {
    const storage = await load();
    localStorage.setItem('app:groups', '{not json');
    storage.getGroups();
    storage.setSettings(['keepTrash']);
    storage.clearCorrupt();
    expect([...storage.getCorrupt()]).toEqual([]);
    expect(storage.getSettings()).toEqual(['keepTrash']);
  });
});

describe('clear', () => {
  it('removes the app and data entries and leaves everything else', async () => {
    const storage = await load();
    storage.setGroups(['a']);
    storage.setElement('card', { name: 'Name' });
    localStorage.setItem('other:key', 'kept');
    storage.clear();
    expect(storage.getGroups()).toEqual([]);
    expect(storage.getElement('card')).toBeUndefined();
    expect(localStorage.getItem('other:key')).toBe('kept');
  });

  it('ignores writes afterwards, so a page unload cannot bring data back', async () => {
    const storage = await load();
    storage.clear();
    storage.setGroups(['a']);
    storage.setElement('card', { name: 'Name' });
    storage.setSettings(['keepTrash']);
    expect(localStorage.length).toBe(0);
  });
});

describe('trash', () => {
  const record = (id, group) => ({ id, group, element: { type: 'card', name: id } });

  it('lists the stored records and skips entries without an id', async () => {
    const storage = await load();
    storage.setTrashed(record('one'));
    storage.setTrashed(record('two', 'box'));
    localStorage.setItem('data:trash:blank', JSON.stringify({ element: {} }));
    storage.setElement('live', { name: 'Live' });
    expect(storage.getTrashed().map(({ id }) => id).sort()).toEqual(['one', 'two']);
    expect(storage.getTrashed().find(({ id }) => id === 'two').group).toBe('box');
  });

  it('removes one record', async () => {
    const storage = await load();
    storage.setTrashed(record('one'));
    storage.setTrashed(record('two'));
    storage.removeTrashed('one');
    expect(storage.getTrashed().map(({ id }) => id)).toEqual(['two']);
  });

  it('clears every record and nothing else', async () => {
    const storage = await load();
    storage.setTrashed(record('one'));
    storage.setTrashed(record('two'));
    storage.setElement('live', { name: 'Live' });
    storage.clearTrashed();
    expect(storage.getTrashed()).toEqual([]);
    expect(storage.getElement('live')).toEqual({ name: 'Live' });
  });
});

describe('keys', () => {
  it('yields every data entry, trash included, and no app entries', async () => {
    const storage = await load();
    storage.setElement('card', { name: 'Name' });
    storage.setTrashed({ id: 'gone', element: { type: 'card' } });
    storage.setGroups(['a']);
    expect([...storage.getKeys()].sort()).toEqual(['data:el:card', 'data:trash:gone']);
  });
});
