const { join, resolve, basename } = require('node:path');
const fs = require('node:fs/promises');
const fetch = require('./fetch');

const DOMAIN = 'https://undercards.net';
const base = join('public', 'resources');
const manifestPath = resolve(__dirname, 'image-etags.json');
const CONCURRENCY = 10;

let etags = {};

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

async function loadEtags() {
  try {
    etags = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  } catch {
    etags = {};
  }
}

async function saveEtags() {
  const sorted = Object.fromEntries(Object.entries(etags).sort(([a], [b]) => a.localeCompare(b)));
  await fs.writeFile(manifestPath, JSON.stringify(sorted, undefined, 2) + '\n');
}

async function exists(file) {
  return fs.access(file).then(() => true, () => false);
}

async function mapLimit(items, limit, fn) {
  const queue = [...items];
  const results = [];
  await Promise.all(Array.from({ length: limit }, async () => {
    while (queue.length) results.push(await fn(queue.shift()));
  }));
  return results;
}

async function download(url, file) {
  const key = url.slice(DOMAIN.length);
  try {
    const headers = {};
    if (etags[key] && await exists(file)) headers['If-None-Match'] = etags[key];
    const image = await fetch(url, { headers });
    if (image.status === 304) return true;
    if (!image.ok) {
      throw new Error(`HTTP ${image.status}`);
    }
    await fs.writeFile(file, image.body);
    const etag = image.headers.get('etag');
    if (etag) etags[key] = etag;
    return true;
  } catch (e) {
    console.error('Failed to save', basename(file), e.message || e);
    return false;
  }
}

async function downloadAvatars(images) {
  const path = join(base, 'images', 'avatars');
  await fs.mkdir(path, { recursive: true });
  const results = await mapLimit(images, CONCURRENCY, (name) => download(
    `${DOMAIN}/images/cards/${name}.png`,
    resolve(path, `${name}.png`),
  ));
  const failed = results.filter((ok) => !ok).length;
  console.log(`Avatars: ${images.length - failed} saved, ${failed} failed`);
  return failed;
}

async function downloadEffects() {
  const path = join(base, 'images', 'effects');
  await fs.mkdir(path, { recursive: true });
  const results = await mapLimit([...effects.values()], CONCURRENCY, (effect) => download(
    `${DOMAIN}/images/powers/${effect}.png`,
    resolve(path, `${effect}.png`),
  ));
  const failed = results.filter((ok) => !ok).length;
  console.log(`Effects: ${effects.size - failed} saved, ${failed} failed`);
  return failed;
}

async function run() {
  await loadEtags();
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

  await saveEtags();

  const failed = avatarsFailed + effectsFailed;
  if (failed) throw new Error(`${failed} download(s) failed`);
}

run().catch((e) => {
  console.error(e.message || e);
  process.exitCode = 1;
});
