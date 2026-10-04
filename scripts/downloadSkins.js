const { join, resolve } = require('node:path');
const fs = require('node:fs/promises');
const fetch = require('./fetch');

const base = join('public', 'resources');
const args = process.argv.slice(2);
const rawPath = args.find((arg) => !arg.startsWith('--')) ?? join('scripts', 'skins.ignore.json');
const dataOnly = args.includes('--no-images');
const concurrency = 4;

const types = {
  1: 'full',
  2: 'breaking',
};

function parseSkins(text) {
  let data = JSON.parse(text);
  if (typeof data === 'string') data = JSON.parse(data);
  if (!Array.isArray(data)) throw new Error('Expected a list of skins');
  return data;
}

function fileName(image) {
  return image.replace(/[<>:"/\\|?*]/g, '_');
}

function collect(skins) {
  const entries = new Map();
  const seen = new Set();
  let skipped = 0;
  skins.forEach(({ image, name, cardName, typeSkin }) => {
    if (!image || typeof image !== 'string') {
      skipped += 1;
      return;
    }
    const file = fileName(image);
    const lower = file.toLowerCase();
    if (seen.has(lower)) {
      console.warn('Duplicate skin image', image);
      skipped += 1;
      return;
    }
    seen.add(lower);
    if (typeSkin && !types[typeSkin]) console.warn('Unknown skin type', typeSkin, image);
    const entry = { name: name ?? image, card: cardName ?? '' };
    if (types[typeSkin]) entry.type = types[typeSkin];
    entries.set(file, { image, entry });
  });
  return { entries, skipped };
}

async function readExisting(path) {
  try {
    return JSON.parse((await fs.readFile(path)).toString());
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
}

async function saveData(entries) {
  const path = resolve(base, 'data', 'skins.json');
  const existing = await readExisting(path);
  const merged = { ...existing };
  entries.forEach(({ entry }, file) => {
    merged[file] = entry;
  });
  const sorted = Object.fromEntries(Object.entries(merged)
    .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase())));
  await fs.mkdir(resolve(base, 'data'), { recursive: true });
  await fs.writeFile(path, JSON.stringify(sorted, undefined, 0));
  console.log(`Skins: ${Object.keys(sorted).length} in data (${entries.size} from this list)`);
}

async function exists(file) {
  try {
    return (await fs.stat(file)).size > 0;
  } catch {
    return false;
  }
}

async function download(image, file) {
  if (await exists(file)) return 'existing';
  try {
    const res = await fetch(`https://undercards.net/images/cards/${encodeURIComponent(image)}.png`);
    if (res.status === 404) return 'missing';
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const partial = `${file}.part`;
    await fs.writeFile(partial, res.body);
    await fs.rename(partial, file);
    return 'saved';
  } catch (e) {
    console.error('Failed to save', image, e.message || e);
    return 'failed';
  }
}

async function downloadImages(entries) {
  const path = join(base, 'images', 'skins');
  await fs.mkdir(path, { recursive: true });
  const queue = [...entries.entries()];
  const counts = { existing: 0, failed: 0, missing: 0, saved: 0 };

  async function worker() {
    while (queue.length) {
      const [file, { image }] = queue.shift();
      counts[await download(image, resolve(path, `${file}.png`))] += 1;
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(`Images: ${counts.saved} saved, ${counts.existing} already had, ${counts.missing} missing, ${counts.failed} failed`);
  return counts.failed;
}

async function run() {
  const { entries, skipped } = collect(parseSkins((await fs.readFile(rawPath)).toString()));
  console.log(`Skins: ${entries.size} read from ${rawPath}${skipped ? `, ${skipped} skipped` : ''}`);
  await saveData(entries);
  if (dataOnly) return;
  const failed = await downloadImages(entries);
  if (failed) throw new Error(`${failed} download(s) failed`);
}

run().catch((e) => {
  console.error(e.message || e);
  process.exitCode = 1;
});
