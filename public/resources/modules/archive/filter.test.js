import { beforeEach, expect, it } from 'vitest';
import { bindFilter, filterRows } from './filter.js';

function row(name, children = [], description = '') {
  const li = document.createElement('li');
  li.dataset.id = name;
  li.innerHTML = '<div class="wrapper"><div class="info"><span class="name"></span></div></div>';
  li.querySelector('.name').textContent = name;
  if (description) li.dataset.search = [name, description].filter(Boolean).join(' ');
  if (children.length) {
    const extra = document.createElement('ul');
    extra.className = 'extra hidden';
    children.forEach((c) => extra.append(row(c)));
    li.append(extra);
  }
  return li;
}

let root;
beforeEach(() => {
  root = document.createElement('ul');
  root.append(row('Fire Dragon'), row('Ice Golem'), row('Spells', ['Fireball', 'Frostbolt']));
  document.body.append(root);
});

const visible = () => [...root.querySelectorAll('li[data-id]')]
  .filter((l) => !l.classList.contains('filtered'))
  .map((l) => l.dataset.id);

it('shows everything with an empty query', () => {
  filterRows(root, '');
  expect(visible()).toEqual(['Fire Dragon', 'Ice Golem', 'Spells', 'Fireball', 'Frostbolt']);
  expect(root.classList.contains('filtering')).toBe(false);
});

it('hides rows that do not match', () => {
  filterRows(root, 'golem');
  expect(visible()).toEqual(['Ice Golem']);
  expect(root.classList.contains('filtering')).toBe(true);
});

it('is case insensitive in both directions', () => {
  filterRows(root, 'FIRE');
  expect(visible()).toEqual(['Fire Dragon', 'Spells', 'Fireball']);
  filterRows(root, 'golem');
  expect(visible()).toEqual(['Ice Golem']);
});

it('keeps a group visible when only a child matches, showing just that child', () => {
  filterRows(root, 'frost');
  expect(visible()).toEqual(['Spells', 'Frostbolt']);
});

it('shows all children when the group itself matches', () => {
  filterRows(root, 'spells');
  expect(visible()).toEqual(['Spells', 'Fireball', 'Frostbolt']);
});

it('restores everything when the query is cleared', () => {
  filterRows(root, 'golem');
  filterRows(root, '');
  expect(visible()).toEqual(['Fire Dragon', 'Ice Golem', 'Spells', 'Fireball', 'Frostbolt']);
});

it('hides everything on no match', () => {
  filterRows(root, 'zzzz');
  expect(visible()).toEqual([]);
});

it('leaves .hidden untouched, so semantic state survives filtering', () => {
  const golem = root.querySelector('[data-id="Ice Golem"]');
  golem.classList.add('hidden');
  filterRows(root, 'golem');
  filterRows(root, '');
  expect(golem.classList.contains('hidden')).toBe(true);
  expect(golem.classList.contains('filtered')).toBe(false);
});

it('bindFilter trims and fires on input and search', () => {
  const input = document.createElement('input');
  const seen = [];
  bindFilter(input, (q) => seen.push(q));
  input.value = '  fire  ';
  input.dispatchEvent(new Event('input'));
  input.value = '';
  input.dispatchEvent(new Event('search'));
  expect(seen).toEqual(['fire', '']);
});

it('matches an element description, not just the name', () => {
  const list = document.createElement('ul');
  list.append(row('Card A', [], 'Deals 3 damage to a monster'));
  list.append(row('Card B', [], 'Heals your soul'));
  document.body.append(list);

  filterRows(list, 'damage');
  expect([...list.querySelectorAll('li')].filter((l) => !l.classList.contains('filtered')).map((l) => l.dataset.id))
    .toEqual(['Card A']);

  filterRows(list, 'soul');
  expect([...list.querySelectorAll('li')].filter((l) => !l.classList.contains('filtered')).map((l) => l.dataset.id))
    .toEqual(['Card B']);

  filterRows(list, 'card');
  expect([...list.querySelectorAll('li')].filter((l) => !l.classList.contains('filtered')).map((l) => l.dataset.id))
    .toEqual(['Card A', 'Card B']);
  list.remove();
});

it('falls back to the name when a row has no search data (images)', () => {
  const list = document.createElement('ul');
  const image = row('avatar.png');
  expect(image.dataset.search).toBeUndefined();
  list.append(image);
  document.body.append(list);
  filterRows(list, 'avatar');
  expect(image.classList.contains('filtered')).toBe(false);
  filterRows(list, 'zzz');
  expect(image.classList.contains('filtered')).toBe(true);
  list.remove();
});
