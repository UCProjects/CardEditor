import { expect, it } from 'vitest';
import VarStore from './VarStore.js';

it('get() reads without consuming', () => {
  const store = new VarStore('default');
  store.set('changed');
  expect(store.get()).toBe('changed');
  expect(store.get()).toBe('changed');
});

it('value reads without consuming', () => {
  const store = new VarStore('default');
  store.set('changed');
  expect(store.value).toBe('changed');
  expect(store.value).toBe('changed');
  expect(store.isSet()).toBe(true);
});

it('consume() returns the value then resets to the default', () => {
  const store = new VarStore('default');
  store.set('changed');
  expect(store.consume()).toBe('changed');
  expect(store.get()).toBe('default');
  expect(store.consume()).toBe('default');
});

it('set() assigns and returns the new value', () => {
  const store = new VarStore(0);
  expect(store.set(5)).toBe(5);
  expect(store.get()).toBe(5);
});

it('value can be assigned', () => {
  const store = new VarStore(0);
  store.value = 9;
  expect(store.get()).toBe(9);
});

it('isSet() tracks divergence from the default', () => {
  const store = new VarStore('default');
  expect(store.isSet()).toBe(false);
  store.set('changed');
  expect(store.isSet()).toBe(true);
  store.consume();
  expect(store.isSet()).toBe(false);
});

it('isSet() compares by identity, so setting the default reads as unset', () => {
  const store = new VarStore(0);
  store.set(0);
  expect(store.isSet()).toBe(false);

  const shared = {};
  const objStore = new VarStore(shared);
  objStore.set(shared);
  expect(objStore.isSet()).toBe(false);
  objStore.set({});
  expect(objStore.isSet()).toBe(true);
});

it('defaults to undefined with no argument', () => {
  const store = new VarStore();
  expect(store.get()).toBeUndefined();
  expect(store.isSet()).toBe(false);
  store.set('x');
  expect(store.isSet()).toBe(true);
  expect(store.consume()).toBe('x');
  expect(store.get()).toBeUndefined();
});

it('is frozen', () => {
  const store = new VarStore(1);
  expect(Object.isFrozen(store)).toBe(true);
});

it('instances are independent', () => {
  const a = new VarStore('a');
  const b = new VarStore('b');
  a.set('changed');
  expect(b.get()).toBe('b');
});
