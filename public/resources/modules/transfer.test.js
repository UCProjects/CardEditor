import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Action, inspect, pack, parseBundle, unpack, VERSION } from './transfer.js';

const { elements, images, makeElement, registered, reservedIds } = vi.hoisted(() => {
  let minted = 0;

  function makeElement({ id, type, content, ...rest }) {
    const element = {
      id: id ?? `new-${minted += 1}`,
      type,
      ...rest,
      emit: vi.fn(),
      isActive: () => false,
      toJSON: () => ({
        id: element.id,
        type,
        ...rest,
        ...(content ? { content: [...element.content] } : {}),
      }),
    };
    if (content) element.content = [...content];
    return element;
  }

  return { elements: new Map(), images: {}, makeElement, registered: [], reservedIds: new Set() };
});

vi.mock('./elements/registry.js', () => ({
  get: (id) => elements.get(id),
  isTaken: (id) => elements.has(id) || reservedIds.has(id),
  init: (props) => makeElement(props),
  register: (el) => {
    registered.push(el.id);
    elements.set(el.id, el);
  },
  save: vi.fn(),
}));

vi.mock('./imageBank.js', () => ({
  ImageType: { Avatar: 'avatar', Rarity: 'rarity', Tribe: 'tribe', Effect: 'effect' },
  isUserImage: (id) => typeof id === 'string' && id.startsWith('img-'),
  getAll: () => images,
  add: (data) => (images[data.id] ? false : (images[data.id] = data, data.id)),
  save: vi.fn(),
}));

function card(id, props = {}) {
  const element = makeElement({ id, type: 'card', ...props });
  elements.set(id, element);
  return element;
}

function group(id, content) {
  const element = makeElement({ id, type: 'group', content });
  elements.set(id, element);
  return element;
}

beforeEach(() => {
  elements.clear();
  Object.keys(images).forEach((key) => delete images[key]);
  registered.length = 0;
  reservedIds.clear();
});

describe('pack', () => {
  it('bundles an element with its user images', async () => {
    images['img-1'] = { src: 'https://example.com/a.png', name: 'Art', type: 'rarity' };
    const bundle = await pack(card('c1', { rarity: 'img-1', image: 'Sans', tribes: ['MONSTER'] }));

    expect(bundle.version).toBe(VERSION);
    expect(bundle.elements).toHaveLength(1);
    expect(bundle.elements[0].id).toBe('c1');
    expect(bundle.assets).toEqual({
      'img-1': { src: 'https://example.com/a.png', name: 'Art', type: 'rarity' },
    });
  });

  it('exports links to this site as relative paths', async () => {
    images['img-1'] = { src: `${location.origin}/resources/tribes/A.png`, type: 'tribe' };
    images['img-2'] = { src: `${location.origin}.example.com/b.png` };
    const bundle = await pack(card('c1', { tribes: ['img-1'], rarity: 'img-2' }));

    expect(bundle.assets['img-1'].src).toBe('/resources/tribes/A.png');
    expect(bundle.assets['img-2'].src).toBe(`${location.origin}.example.com/b.png`);
  });

  it('ignores built-in references', async () => {
    const bundle = await pack(card('c1', { image: 'Sans', rarity: 'LEGENDARY', tribes: ['MONSTER'] }));
    expect(bundle.assets).toEqual({});
  });

  it('collects assets from effects, including counted entries', async () => {
    images['img-1'] = { src: 'data:image/png;base64,AAA' };
    images['img-2'] = { src: 'data:image/png;base64,BBB' };
    const bundle = await pack(card('c1', { effects: ['img-1', ['img-2', 3], 'Burn'] }));
    expect(Object.keys(bundle.assets).sort()).toEqual(['img-1', 'img-2']);
  });

  it('serialises file-backed assets to a data url', async () => {
    images['img-1'] = { file: new File(['hi'], 'art.png', { type: 'image/png' }), type: 'tribe' };
    const bundle = await pack(card('c1', { tribes: ['img-1'] }));
    expect(bundle.assets['img-1'].src.startsWith('data:image/png;base64,')).toBe(true);
    expect(bundle.assets['img-1'].name).toBe('art.png');
  });

  it('omits assets but keeps their references when asked', async () => {
    images['img-1'] = { src: 'https://example.com/a.png', type: 'rarity' };
    const element = card('c1', { rarity: 'img-1', effects: ['img-1'] });
    const bundle = await pack(element, { withAssets: false });

    expect(bundle.assets).toEqual({});
    expect(bundle.elements[0].rarity).toBe('img-1');
    expect(bundle.elements[0].effects).toEqual(['img-1']);
  });

  it('still bundles children when assets are omitted', async () => {
    images['img-1'] = { src: 'https://example.com/a.png' };
    card('c1', { rarity: 'img-1' });
    const bundle = await pack(group('g1', ['c1']), { withAssets: false });

    expect(bundle.elements.map((e) => e.id)).toEqual(['g1', 'c1']);
    expect(bundle.assets).toEqual({});
  });

  it('leaves empty fields out of bundled elements', async () => {
    const bundle = await pack(card('c1', { cost: 0, frame: '', rarity: ' ', soul: '', tribes: [], effects: [] }));
    expect(bundle.elements[0]).toEqual({ id: 'c1', type: 'card', cost: 0 });
  });

  it('skips cached blob urls', async () => {
    images['img-1'] = { src: 'blob:http://localhost/abc' };
    const bundle = await pack(card('c1', { rarity: 'img-1' }));
    expect(bundle.assets).toEqual({});
  });

  it('includes group children and their assets', async () => {
    images['img-1'] = { src: 'https://example.com/a.png' };
    card('c1', { rarity: 'img-1' });
    card('c2', {});
    const bundle = await pack(group('g1', ['c1', 'c2']));

    expect(bundle.elements.map((e) => e.id)).toEqual(['g1', 'c1', 'c2']);
    expect(Object.keys(bundle.assets)).toEqual(['img-1']);
  });
});

describe('parseBundle', () => {
  it('accepts editor data', () => {
    const data = { version: VERSION, assets: {}, elements: [] };
    expect(parseBundle(JSON.stringify(data))).toEqual(data);
  });

  it('ignores anything else', () => {
    expect(parseBundle('hello')).toBeUndefined();
    expect(parseBundle('{ nope')).toBeUndefined();
    expect(parseBundle('{"a":1}')).toBeUndefined();
    expect(parseBundle('[1,2]')).toBeUndefined();
    expect(parseBundle(undefined)).toBeUndefined();
  });
});

describe('inspect', () => {
  it('lists each element, noting which exist and which group holds it', () => {
    card('c1', {});
    const info = inspect({
      version: VERSION,
      assets: { 'img-1': { src: 'x' } },
      elements: [
        { id: 'g1', type: 'group', name: 'Box', content: ['c1', 'c2'] },
        { id: 'c1', type: 'card', name: 'Old' },
        { id: 'c2', type: 'card' },
      ],
    });

    expect(info).toEqual({
      elements: 3,
      assets: 1,
      items: [
        { id: 'g1', type: 'group', name: 'Box', exists: false, trashed: false, parent: undefined },
        { id: 'c1', type: 'card', name: 'Old', exists: true, trashed: false, parent: 'g1' },
        { id: 'c2', type: 'card', name: 'card', exists: false, trashed: false, parent: 'g1' },
      ],
    });
  });

  it('marks elements whose id is held by the trash', () => {
    reservedIds.add('t1');
    const { items } = inspect({ version: VERSION, assets: {}, elements: [{ id: 't1', type: 'card' }] });
    expect(items[0]).toMatchObject({ exists: false, trashed: true });
  });

  it('does not count a different type as existing', () => {
    card('x1', {});
    const { items } = inspect({ version: VERSION, assets: {}, elements: [{ id: 'x1', type: 'text' }] });
    expect(items[0].exists).toBe(false);
  });
});

describe('unpack', () => {
  const bundle = (over = {}) => ({ version: VERSION, assets: {}, elements: [], ...over });

  it('rejects a bad version', async () => {
    await expect(unpack(bundle({ version: 99, elements: [{ id: 'a', type: 'card' }] })))
      .rejects.toThrow('Unsupported export version');
  });

  it('rejects an empty bundle', async () => {
    await expect(unpack(bundle())).rejects.toThrow('no elements');
  });

  it('registers elements and returns the roots', async () => {
    const roots = await unpack(bundle({
      elements: [{ id: 'g1', type: 'group', content: ['c1'] }, { id: 'c1', type: 'card' }],
    }));

    expect(roots.map((e) => e.id)).toEqual(['g1']);
    expect(elements.has('g1')).toBe(true);
    expect(elements.has('c1')).toBe(true);
  });

  it('registers children before their group', async () => {
    await unpack(bundle({
      elements: [
        { id: 'g1', type: 'group', content: ['c1', 'c2'] },
        { id: 'c1', type: 'card' },
        { id: 'c2', type: 'card' },
      ],
    }));

    expect(registered).toEqual(['c1', 'c2', 'g1']);
  });

  it('registers children before their group regardless of bundle order', async () => {
    await unpack(bundle({
      elements: [
        { id: 'c1', type: 'card' },
        { id: 'g1', type: 'group', content: ['c1'] },
      ],
    }));

    expect(registered).toEqual(['c1', 'g1']);
  });

  it('remaps group content when an id is taken', async () => {
    card('c1', {});
    const [root] = await unpack(bundle({
      elements: [{ id: 'g1', type: 'group', content: ['c1'] }, { id: 'c1', type: 'card' }],
    }));

    expect(root.content).toHaveLength(1);
    expect(root.content[0]).not.toBe('c1');
    expect(elements.has(root.content[0])).toBe(true);
  });

  it('converts data urls into files', async () => {
    await unpack(bundle({
      assets: { 'img-1': { src: 'data:image/png;base64,aGk=', name: 'art.png', type: 'tribe' } },
      elements: [{ id: 'c1', type: 'card', tribes: ['img-1'] }],
    }));

    expect(images['img-1'].file).toBeInstanceOf(File);
    expect(images['img-1'].file.name).toBe('art.png');
    expect(images['img-1'].type).toBe('tribe');
  });

  it('keeps external urls as-is', async () => {
    await unpack(bundle({
      assets: { 'img-1': { src: 'https://example.com/a.png' } },
      elements: [{ id: 'c1', type: 'card', rarity: 'img-1' }],
    }));

    expect(images['img-1'].src).toBe('https://example.com/a.png');
    expect(images['img-1'].file).toBeUndefined();
  });

  it('leaves out elements marked to skip', async () => {
    const roots = await unpack(bundle({
      elements: [{ id: 'c1', type: 'card' }, { id: 'c2', type: 'card' }],
    }), { actions: { c1: Action.Skip } });

    expect(roots.map((e) => e.id)).toEqual(['c2']);
    expect(elements.has('c1')).toBe(false);
  });

  it('drops a skipped child from its group', async () => {
    const [root] = await unpack(bundle({
      elements: [
        { id: 'g1', type: 'group', content: ['c1', 'c2'] },
        { id: 'c1', type: 'card' },
        { id: 'c2', type: 'card' },
      ],
    }), { actions: { c1: Action.Skip } });

    expect(root.content).toEqual(['c2']);
    expect(elements.has('c1')).toBe(false);
  });

  it('imports the children of a skipped group on their own', async () => {
    const roots = await unpack(bundle({
      elements: [{ id: 'g1', type: 'group', content: ['c1'] }, { id: 'c1', type: 'card' }],
    }), { actions: { g1: Action.Skip } });

    expect(roots.map((e) => e.id)).toEqual(['c1']);
    expect(elements.has('g1')).toBe(false);
  });

  it('chooses an action per element', async () => {
    const one = card('c1', { name: 'One' });
    const two = card('c2', { name: 'Two' });
    const roots = await unpack(bundle({
      elements: [{ id: 'c1', type: 'card', name: 'New' }, { id: 'c2', type: 'card', name: 'New' }],
    }), { actions: { c1: Action.Replace, c2: Action.Copy } });

    expect(one.emit).toHaveBeenCalledWith('update', expect.objectContaining({ name: 'New' }));
    expect(two.emit).not.toHaveBeenCalled();
    expect(roots).toHaveLength(1);
    expect(roots[0].id).not.toBe('c2');
  });

  it('skips assets when asked', async () => {
    await unpack(bundle({
      assets: { 'img-1': { src: 'https://example.com/a.png' } },
      elements: [{ id: 'c1', type: 'card', rarity: 'img-1' }],
    }), { assets: false });

    expect(images['img-1']).toBeUndefined();
  });

  it('imports a copy of an existing element by default', async () => {
    const existing = card('c1', { name: 'Old' });
    const roots = await unpack(bundle({ elements: [{ id: 'c1', type: 'card', name: 'New' }] }));

    expect(roots).toHaveLength(1);
    expect(roots[0].id).not.toBe('c1');
    expect(existing.emit).not.toHaveBeenCalled();
  });

  it('never reuses the id of a trashed element', async () => {
    reservedIds.add('c1');
    const roots = await unpack(bundle({ elements: [{ id: 'c1', type: 'card' }] }), { actions: { c1: Action.Replace } });

    expect(roots).toHaveLength(1);
    expect(roots[0].id).not.toBe('c1');
  });

  it('overwrites an existing element when replacing', async () => {
    const existing = card('c1', { name: 'Old' });
    const roots = await unpack(bundle({ elements: [{ id: 'c1', type: 'card', name: 'New' }] }), { actions: { c1: Action.Replace } });

    expect(roots).toEqual([]);
    expect(registered).toEqual([]);
    expect(existing.emit).toHaveBeenCalledWith('update', expect.objectContaining({ name: 'New' }));
    expect(existing.emit.mock.calls[0][1]).not.toHaveProperty('id');
  });

  it('copies instead of replacing when the types differ', async () => {
    const existing = card('x1', {});
    const roots = await unpack(bundle({ elements: [{ id: 'x1', type: 'text' }] }), { actions: { x1: Action.Replace } });

    expect(roots).toHaveLength(1);
    expect(roots[0].id).not.toBe('x1');
    expect(existing.emit).not.toHaveBeenCalled();
  });

  it('adds new children to a replaced group', async () => {
    const existing = group('g1', []);
    const roots = await unpack(bundle({
      elements: [{ id: 'g1', type: 'group', content: ['c9'] }, { id: 'c9', type: 'card' }],
    }), { actions: { g1: Action.Replace } });

    expect(roots).toEqual([]);
    expect(existing.content).toEqual(['c9']);
    expect(elements.has('c9')).toBe(true);
  });

  it('leaves an already known asset alone', async () => {
    images['img-1'] = { src: 'https://example.com/original.png' };
    await unpack(bundle({
      assets: { 'img-1': { src: 'https://example.com/replacement.png' } },
      elements: [{ id: 'c1', type: 'card', rarity: 'img-1' }],
    }));

    expect(images['img-1'].src).toBe('https://example.com/original.png');
  });
});
