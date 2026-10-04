const { join, resolve, basename } = require('node:path');
const fs = require('node:fs/promises');
const fetch = require('./fetch');

const DOMAIN = 'https://undercards.net';
const base = join('public', 'resources');

const effects = new Set([
  'BonusCost',
  'MalusCost',
  'Determination',
  'BonusAtk',
  'MalusAtk',
  'BonusHp',
  'MalusHp',
  'Underevent2024',
  'Burn',
  'Box',
  'Invulnerable',
  'Silenced',
  'Ranged',
  'Created',
]);

async function updateFile(path, data) {
  // Load existing
  const file = await fs.readFile(path);
  const existing = JSON.parse(file.toString());

  // Combine with existing data
  const newData = Array.isArray(data) ? [...new Set([
    ...existing,
    ...data,
  ]).values()] : {
    ...existing,
    ...data,
  };

  // Save
  await fs.writeFile(path, JSON.stringify(newData, undefined, 0));
}

async function getAllCards() {
  const data = await fetch(`${DOMAIN}/card-data/latest.json`);
  if (!data?.ok) throw new Error(`Failed to retrieve latest card data: ${data.statusText}`,);
  const { url } = await data.json();
  return fetch(`${DOMAIN}/${url}`);
}

async function download(url, file) {
  try {
    const image = await fetch(url);
    if (!image.ok) {
      throw new Error(`HTTP ${image.status}`);
    }
    await fs.writeFile(file, image.body);
    return true;
  } catch (e) {
    console.error('Failed to save', basename(file), e.message || e);
    return false;
  }
}

async function downloadAvatars(images) {
  const path = join(base, 'images', 'avatars');
  await fs.mkdir(path, { recursive: true });
  let failed = 0;
  for (const name of images) {
    const url = `${DOMAIN}/images/cards/${name}.png`;
    if (!await download(url, resolve(path, `${name}.png`))) failed += 1;
  }
  console.log(`Avatars: ${images.length - failed} saved, ${failed} failed`);
  return failed;
}

async function downloadEffects() {
  const path = join(base, 'images', 'effects');
  await fs.mkdir(path, { recursive: true });
  let failed = 0;
  for (const effect of effects.values()) {
    const url = `${DOMAIN}/images/powers/${effect}.png`;
    if (!await download(url, resolve(path, `${effect}.png`))) failed += 1;
  }
  console.log(`Effects: ${effects.size - failed} saved, ${failed} failed`);
  return failed;
}

async function run() {
  const res = await getAllCards();
  if (!res.ok) throw new Error(`AllCards: HTTP ${res.status}`);

  const { cards } = await res.json();
  const parsed = JSON.parse(cards);
  const avatars = Object.fromEntries(parsed.map(({ name, image, statuses = [] }) => {
    statuses.forEach(({ name: effect }) => effects.add(effect));
    return [name, image];
  }));

  console.log(`Cards: ${parsed.length}, effects: ${effects.size}`);

  const [, , avatarsFailed, effectsFailed] = await Promise.all([
    updateFile(resolve(base, 'data', 'avatars.json'), avatars),
    updateFile(resolve(base, 'data', 'status.json'), [...effects.values()]),
    downloadAvatars(Object.values(avatars)),
    downloadEffects(),
  ]);

  const failed = avatarsFailed + effectsFailed;
  if (failed) throw new Error(`${failed} download(s) failed`);
}

run().catch((e) => {
  console.error(e.message || e);
  process.exitCode = 1;
});
