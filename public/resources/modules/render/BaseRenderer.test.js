import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventEmitter from '../utils/EventEmitter.js';

const { register, save } = vi.hoisted(() => ({ register: vi.fn(), save: vi.fn() }));

vi.mock('../editor/editor.js', () => ({ default: {} }));
vi.mock('../3rdparty/saveImage.js', () => ({ default: vi.fn() }));
vi.mock('../archive/index.js', () => ({ isOpen: () => false }));
vi.mock('./util.js', () => ({ getHTMLDescription: (text) => text }));
vi.mock('../elements/registry.js', () => ({ register, save }));

const { default: BaseRenderer } = await import('./BaseRenderer.js');
const { rendererOf } = await import('./renderers.js');

function createElement() {
  return Object.assign(new EventEmitter(), {
    id: 'element-id',
    type: 'card',
    name: 'Name',
    description: '',
  });
}

describe('BaseRenderer', () => {
  beforeEach(() => {
    register.mockClear();
    save.mockClear();
  });

  it('registers and saves its element when it saves', () => {
    const element = createElement();
    const renderer = new BaseRenderer(element);
    renderer.emit('save');
    expect(register).toHaveBeenCalledWith(element);
    expect(save).toHaveBeenCalledWith(element);
  });

  it('saves when its element is updated', () => {
    const element = createElement();
    new BaseRenderer(element);
    element.emit('updated', ['name']);
    expect(save).toHaveBeenCalledWith(element);
  });

  it('never registers or saves its element as a preview', () => {
    const element = createElement();
    const renderer = new BaseRenderer(element).asPreview();
    renderer.emit('save');
    element.emit('updated', ['name']);
    expect(register).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('returns itself from asPreview', () => {
    const renderer = new BaseRenderer(createElement());
    expect(renderer.asPreview()).toBe(renderer);
  });

  it('can be found from its container', () => {
    const renderer = new BaseRenderer(createElement());
    expect(rendererOf(renderer.container)).toBe(renderer);
    expect(rendererOf(document.createElement('div'))).toBeUndefined();
  });
});
