import { add, events, getAll, getName, getURL, isUserImage, save } from './imageBank.js';
import { error } from './toast/index.js';

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

/**
 * @param {{
 *  type: import('./imageBank.js').ImageTypes;
 *  section: string;
 *  noun: string;
 *  dataKey?: string;
 * }} options
 */
export function load({ type, section, noun, dataKey = 'value' }) {
  const container = document.querySelector(`[data-editing="${section}"]`);
  const controls = container.querySelector('.add-custom');
  const custom = container.querySelector('fieldset[name="custom"]');
  const grid = custom.querySelector('.grid');
  const fileButton = controls.querySelector('[data-source="file"]');
  const linkButton = controls.querySelector('[data-source="url"]');
  fileButton.setAttribute('aria-label', `Add custom ${noun} from file`);
  linkButton.setAttribute('aria-label', `Add custom ${noun} from link`);
  const input = controls.querySelector('input[type="file"]');
  const link = controls.querySelector('input[type="url"]');
  const warn = controls.querySelector('.warn').classList;

  /**
   * @param {string} id
   * @param {import('./imageBank.js').ImageStore} data
   */
  function isCustom(id, data) {
    return data?.type === type && isUserImage(id);
  }

  /** @param {string} id */
  function addTile(id) {
    const name = getName(id);
    const img = document.createElement('img');
    img.src = getURL(id, type);
    img.classList.add('selectable', 'smallIcon');
    img.alt = name;
    img.dataset.tip = name;
    img.dataset[dataKey] = id;
    img.draggable = false;
    grid.append(img);
  }

  /** @param {import('./imageBank.js').ImageStore} data */
  async function store(data) {
    const id = add({ ...data, type });
    if (!id) return;
    try {
      await save(id);
    } catch (e) {
      console.error(e);
      error({ body: `Failed to save ${noun}` });
    }
  }

  Object.entries(getAll(type, true)).forEach(([id, data]) => {
    if (isCustom(id, data)) addTile(id);
  });

  events.on('new', ({ id, ...data }) => {
    if (isCustom(id, data)) addTile(id);
  });

  events.on('remove', (id) => {
    grid.querySelector(`[data-${dataKey}="${id}"]`)?.remove();
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
