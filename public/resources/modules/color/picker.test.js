import { expect } from 'vitest';
import { hexInputListener } from './picker.js';
import TextPicker from './textPicker.js';

function inputType({ data, paste }) {
  if (paste !== undefined) return 'insertFromPaste';
  return data ? 'insertText' : 'deleteContentBackward';
}

function edit(initial, [start, end], options = {}) {
  const { data = null, paste } = options;
  const el = document.createElement('input');
  el.type = 'text';
  el.maxLength = 6;
  document.body.append(el);
  el.value = initial;
  el.setSelectionRange(start, end);

  let inputs = 0;
  el.addEventListener('input', () => { inputs += 1; });
  el.addEventListener('beforeinput', hexInputListener);

  const event = new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    data,
    inputType: options.inputType ?? inputType(options),
  });
  if (paste !== undefined) {
    Object.defineProperty(event, 'dataTransfer', { value: { getData: () => paste } });
  }

  const allowed = el.dispatchEvent(event);
  const inserted = data || paste;
  if (allowed && inserted) el.setRangeText(inserted, start, end, 'end');

  const result = { value: el.value, blocked: !allowed, inputs };
  el.remove();
  return result;
}

describe('TextPicker', () => {
  it('Requires a text entry element', () => {
    expect(() => new TextPicker(document.createElement('div'))).toThrow();
    expect(() => new TextPicker(null)).toThrow();
    expect(() => new TextPicker(document.createElement('textarea'))).not.toThrow();
    expect(() => new TextPicker(document.createElement('input'))).not.toThrow();
  });
});

describe('hexInputListener', () => {
  it('Allows typed hex', () => {
    expect(edit('', [0, 0], { data: 'f' })).toMatchObject({ value: 'f', blocked: false });
  });

  it('Blocks typed characters outside hex', () => {
    expect(edit('', [0, 0], { data: 'z' }).blocked).toBe(true);
    expect(edit('', [0, 0], { data: '#' }).blocked).toBe(true);
  });

  it('Blocks a seventh character', () => {
    expect(edit('ffffff', [6, 6], { data: 'f' }).blocked).toBe(true);
  });

  it('Allows deletions', () => {
    expect(edit('ffffff', [5, 6]).blocked).toBe(false);
  });

  it('Allows a clean paste without intervening', () => {
    expect(edit('', [0, 0], { paste: 'ff0000' }))
      .toEqual({ value: 'ff0000', blocked: false, inputs: 0 });
  });

  it('Strips a leading # and re-inserts', () => {
    expect(edit('', [0, 0], { paste: '#ff0000' }))
      .toEqual({ value: 'ff0000', blocked: true, inputs: 1 });
  });

  it('Replaces the selection when pasting over it', () => {
    expect(edit('aabbcc', [0, 6], { paste: '#00ff00' }))
      .toEqual({ value: '00ff00', blocked: true, inputs: 1 });
  });

  it('Blocks a paste outside hex', () => {
    expect(edit('', [0, 0], { paste: 'zzzzzz' }).blocked).toBe(true);
    expect(edit('', [0, 0], { paste: '#zzzzzz' }).blocked).toBe(true);
    expect(edit('', [0, 0], { paste: '#ff 000' }).blocked).toBe(true);
    expect(edit('', [0, 0], { paste: '##ff000' }).blocked).toBe(true);
  });

  it('Blocks a paste that would overflow', () => {
    expect(edit('aa', [2, 2], { paste: '#ff0000' }).blocked).toBe(true);
  });

  it('Blocks a dropped link', () => {
    expect(edit('', [0, 0], { paste: 'https://example.com', inputType: 'insertFromDrop' }).blocked).toBe(true);
  });

  it('Blocks composed text outside hex', () => {
    expect(edit('', [0, 0], { data: 'zz', inputType: 'insertCompositionText' }).blocked).toBe(true);
  });

  it('Reads dataTransfer when data is empty rather than null', () => {
    expect(edit('', [0, 0], { data: '', paste: '#ff0000' }))
      .toEqual({ value: 'ff0000', blocked: true, inputs: 1 });
  });
});
