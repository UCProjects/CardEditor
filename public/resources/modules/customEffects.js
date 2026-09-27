import { add, events, getAll, getName, getURL, ImageType, isUserImage, save } from './imageBank.js';
import { error } from './toast/index.js';

/** @type {HTMLDivElement} */
const grid = document.getElementById('customEffects');
/** @type {HTMLDivElement} */
const controls = document.querySelector('[data-editing="effects"] .addEffects');
/** @type {HTMLButtonElement} */
const fileButton = controls.querySelector('[data-source="file"]');
/** @type {HTMLButtonElement} */
const linkButton = controls.querySelector('[data-source="url"]');
/** @type {HTMLInputElement} */
const input = controls.querySelector('input[name="effect"]');
/** @type {HTMLInputElement} */
const link = controls.querySelector('input[name="effectUrl"]');
const warn = controls.querySelector('.warn').classList;

/**
 * @param {string} id
 * @param {import('./imageBank.js').ImageStore} data
 */
function isCustom(id, data) {
  return data?.type === ImageType.Effect && isUserImage(id);
}

/** @param {string} id */
function addTile(id) {
  const name = getName(id);
  const img = document.createElement('img');
  img.src = getURL(id, ImageType.Effect);
  img.classList.add('selectable', 'smallIcon');
  img.alt = name;
  img.dataset.tip = name;
  img.dataset.value = id;
  img.draggable = false;
  grid.append(img);
}

/**
 * @param {string} src
 * @returns {Promise<boolean>}
 */
function loads(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/** @param {string} src */
function nameFromURL(src) {
  try {
    return new URL(src).pathname.split('/').pop().replace(/\.[^.]+$/, '') || src;
  } catch {
    return src;
  }
}

/** @param {import('./imageBank.js').ImageStore} data */
async function store(data) {
  const id = add({ ...data, type: ImageType.Effect });
  if (!id) return;
  try {
    await save(id);
  } catch (e) {
    console.error(e);
    error({ body: 'Failed to save effect' });
  }
}

export function load() {
  Object.entries(getAll(ImageType.Effect, true)).forEach(([id, data]) => {
    if (isCustom(id, data)) addTile(id);
  });

  events.on('new', ({ id, ...data }) => {
    if (isCustom(id, data)) addTile(id);
  });

  events.on('remove', (id) => {
    grid.querySelector(`[data-value="${id}"]`)?.remove();
  });

  fileButton.addEventListener('click', () => {
    warn.add('hidden');
    link.classList.add('hidden');
    input.click();
  });

  linkButton.addEventListener('click', () => {
    warn.add('hidden');
    if (!link.classList.toggle('hidden')) link.focus();
  });

  input.addEventListener('change', () => {
    const [upload] = input.files;
    input.value = '';
    if (!upload) return;
    warn.add('hidden');
    store({ file: upload, name: upload.name.replace(/\.[^.]+$/, '') });
  });

  link.addEventListener('change', async () => {
    const src = link.value.trim();
    warn.add('hidden');
    if (!src) return;
    if (!link.checkValidity() || !await loads(src)) {
      warn.remove('hidden');
      return;
    }
    link.value = '';
    link.classList.add('hidden');
    store({ src, name: nameFromURL(src) });
  });
}
