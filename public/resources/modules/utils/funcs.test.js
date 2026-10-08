import { describe, expect, it } from 'vitest';
import { stripEmpty } from './funcs.js';

describe('stripEmpty', () => {
  it('drops empty and blank values', () => {
    const json = JSON.stringify({ a: '', b: '  ', c: [], d: undefined, e: 'x' }, stripEmpty);
    expect(JSON.parse(json)).toEqual({ e: 'x' });
  });

  it('keeps falsy numbers and booleans', () => {
    const json = JSON.stringify({ zero: 0, no: false, list: [0] }, stripEmpty);
    expect(JSON.parse(json)).toEqual({ zero: 0, no: false, list: [0] });
  });

  it('strips nested values and trims strings', () => {
    const json = JSON.stringify({ inner: { tags: [], name: ' Sans ' } }, stripEmpty);
    expect(JSON.parse(json)).toEqual({ inner: { name: 'Sans' } });
  });
});
