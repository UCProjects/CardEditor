import { expect } from 'vitest';
import ValuePicker from './valuePicker.js';

let shown = false;

/** happy-dom has no Popover API, which isOpen/open/close rely on */
beforeAll(() => {
  const el = document.getElementById('picker');
  const matches = el.matches.bind(el);
  el.showPopover = () => { shown = true; };
  el.hidePopover = () => { shown = false; };
  el.matches = (selector) => (selector === ':popover-open' ? shown : matches(selector));
});

beforeEach(() => {
  shown = false;
});

function open(picker, options) {
  picker.open({ focus: false, ...options });
  return picker;
}

function setup() {
  const trigger = document.createElement('span');
  document.body.append(trigger);
  const picker = new ValuePicker(trigger);
  const seen = [];
  picker.on('change', (value) => seen.push(value));
  return { picker, seen, trigger };
}

describe('ValuePicker', () => {
  it('Requires an element', () => {
    expect(() => new ValuePicker(null)).toThrow();
    expect(() => new ValuePicker(document.createElement('span'))).not.toThrow();
  });

  it('Does not write anything when preview is off', () => {
    const { picker, seen } = setup();
    open(picker, { preview: false });
    expect(seen).toEqual([]);
  });

  it('Previews the seeded color immediately', () => {
    const { picker, seen } = setup();
    open(picker, { seed: '#00ff00' });
    expect(seen).toEqual(['#00ff00']);
  });

  it('Reverts a previewed seed on cancel', () => {
    const { picker, seen } = setup();
    open(picker, { seed: '#00ff00' });
    picker.close(false);
    expect(seen.at(-1)).toBe('');
  });

  it('Does not preview when editing an existing color', () => {
    const { picker, seen } = setup();
    open(picker, { hex: '#00ff00' });
    expect(seen).toEqual([]);
  });

  it('Emits the chosen color', () => {
    const { picker, seen } = setup();
    open(picker, { preview: false });
    picker.apply('ff0000', true);
    expect(seen.at(-1)).toBe('#ff0000');
  });

  it('Clears on cancel when opened without a color', () => {
    const { picker, seen } = setup();
    open(picker, { preview: false });
    picker.apply('ff0000', true);
    picker.close(false);
    expect(seen.at(-1)).toBe('');
  });

  it('Clears on cancel even when seeded with a remembered color', () => {
    const { picker, seen } = setup();
    open(picker, { preview: false, seed: '#00ff00' });
    picker.apply('ff0000', true);
    picker.close(false);
    expect(seen.at(-1)).toBe('');
  });

  it('Restores the original color on cancel when editing one', () => {
    const { picker, seen } = setup();
    open(picker, { hex: '#00ff00' });
    picker.apply('ff0000', true);
    picker.close(false);
    expect(seen.at(-1)).toBe('#00ff00');
  });

  it('Keeps the chosen color on confirm', () => {
    const { picker, seen } = setup();
    open(picker, { preview: false });
    picker.apply('ff0000', true);
    picker.close(true);
    expect(seen.at(-1)).toBe('#ff0000');
  });
});
