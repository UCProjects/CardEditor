const { join, resolve, basename } = require('node:path');
const fs = require('node:fs/promises');
const fetch = require('./fetch');

const base = join('public', 'resources', 'images');

const skins = [
  'Undertale',
  'Deltarune',
  'Christmas2020',
  'Golden',
  'Halloween2020',
  'Ranked2025',
  'Spider_Party',
  'Time_to_get_serious',
  'Vaporwave',
];

const frames = [
  'frame_monster',
  'frame_spell',
  'frame_shiny',
  'frame_shiny_animated',
];

async function download(url, file) {
  try {
    const image = await fetch(url);
    if (image.status === 404) {
      console.log('Missing', url);
      return 'missing';
    }
    if (!image.ok) {
      throw new Error(`HTTP ${image.status}`);
    }
    await fs.writeFile(file, image.body);
    return 'saved';
  } catch (e) {
    console.error('Failed to save', basename(file), e.message || e);
    return 'failed';
  }
}

async function downloadFrames() {
  const counts = { saved: 0, missing: 0, failed: 0 };
  for (const skin of skins) {
    const path = join(base, 'frames', skin);
    await fs.mkdir(path, { recursive: true });
    for (const frame of frames) {
      const url = `https://undercards.net/images/frameSkins/${skin}/${frame}.png`;
      counts[await download(url, resolve(path, `${frame}.png`))] += 1;
    }
  }
  console.log(`Frames: ${counts.saved} saved, ${counts.missing} missing, ${counts.failed} failed`);
  return counts.failed;
}

async function downloadAssets() {
  const path = join(base, 'cardAssets');
  await fs.mkdir(path, { recursive: true });
  const result = await download('https://undercards.net/images/cardAssets/silence.png', resolve(path, 'silence.png'));
  console.log(`Card assets: ${result}`);
  return result === 'failed' ? 1 : 0;
}

async function run() {
  const failed = await downloadFrames() + await downloadAssets();
  if (failed) throw new Error(`${failed} download(s) failed`);
}

run().catch((e) => {
  console.error(e.message || e);
  process.exitCode = 1;
});
