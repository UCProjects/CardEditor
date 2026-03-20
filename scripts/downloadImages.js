const { join, resolve, basename } = require('node:path');
const fs = require('node:fs/promises');
const fetch = require('node-fetch');

const base = join('public', 'resources');

const effects = new Set([
  'bonusCost',
  'malusCost',
  'determination',
  'bonusAtk',
  'malusAtk',
  'bonusHp',
  'malusHp',
  'underevent2024',
  'burn',
  'box',
  'invulnerable',
  'silenced',
  'ranged',
]);

async function updateFile(path, data) {
  // Create blank if not exists
  await fs.writeFile(path, Array.isArray(data) ? [] : {}, { flag: 'wx' });

  // Load existing
  const file = await fs.readFile(path);
  const existing = JSON.parse(file.toString());

  // Combine with existing data
  const newData = Array.isArray(data) ? new Set([
    ...existing,
    ...data,
  ]).values() : {
    ...existing,
    ...data,
  };

  // Save
  await fs.writeFile(path, JSON.stringify(newData, undefined, 0));
}

async function download(url, file) {
  try {
    const image = await fetch(url);
    await fs.writeFile(file, image.body);
  } catch {
    console.error('Failed to save', basename(file));
  }
}

async function downloadAvatars(images) {
  const path = join(base, 'images', 'avatars');
  for (const name in images) {
    const url = `https://undercards.net/images/cards/${name}.png`;
    await download(url, resolve(path, `${name}.png`));
  }
}

async function downloadEffects() {
  const path = join(base, 'images', 'effects');
  const values = effects.values();
  for (const effect in values) {
    const url = `https://undercards.net/images/powers/${effect}.png`;
    await download(url, resolve(path, `${effect}.png`));
  }
}

fetch('https://undercards.net/AllCards')
  .then((res) => res.json())
  .then(({ cards }) => JSON.parse(cards))
  .then((cards) => Object.fromEntries(cards.map(({ name, image, statuses = [] }) => {
    statuses.forEach(({ name: effect }) => effects.add(effect));
    return [name, image];
  })))
  .then((avatars) => Promise.all([
    updateFile(resolve(base, 'data', 'avatars.json'), avatars),
    updateFile(resolve(base, 'data', 'effects.json'), effects.values()),
    downloadAvatars(Object.values(avatars)),
    downloadEffects(),
  ]));
