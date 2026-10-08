import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pack, unpack, VERSION } from './transfer.js';

const { elements, images, makeElement, registered } = vi.hoisted(() => {
  let minted = 0;

  function makeElement({ id, type, content, ...rest }) {
    const element = {
      id: id ?? `new-${minted += 1}`,
      type,
      ...rest,
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

  return { elements: new Map(), images: {}, makeElement, registered: [] };
});

vi.mock('./elements/registry.js', () => ({
  get: (id) => elements.get(id),
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

  it('leaves an already known asset alone', async () => {
    images['img-1'] = { src: 'https://example.com/original.png' };
    await unpack(bundle({
      assets: { 'img-1': { src: 'https://example.com/replacement.png' } },
      elements: [{ id: 'c1', type: 'card', rarity: 'img-1' }],
    }));

    expect(images['img-1'].src).toBe('https://example.com/original.png');
  });
});
