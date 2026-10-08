import style from '../../styles/settings.css' with { type: 'css' };
import settings from '../settings.js';
import { adoptStyle } from '../utils/funcs.js';
import confirm from '../confirm/index.js';
import { tryOrError } from '../toast/index.js';
import { clear as clearImages } from '../utils/imageDB.js';
import { clear, clearCorrupt, getCorrupt } from '../utils/storage.js';

adoptStyle(style);

/** @type {HTMLTemplateElement} */
const template = document.querySelector('template#setting');
/** @type {HTMLDivElement} */
const settingsDiv = document.querySelector('[data-page="settings"] div.settings');
/** @type {HTMLButtonElement} */
const cleanup = document.querySelector('#corrupt-cleanup');
/** @type {HTMLButtonElement} */
const reset = document.querySelector('#reset-editor');

export function load() {
  settings.getAll().forEach(add);

  cleanup.addEventListener('click', () => {
    clearCorrupt();
    refreshCleanup();
  });
  refreshCleanup();

  reset.addEventListener('click', async () => {
    const accepted = await confirm({
      title: 'Reset Editor?',
      body: 'This permanently deletes every group, element, uploaded image and setting. This cannot be undone.',
      accept: 'Delete Everything',
      destructive: true,
    });
    if (!accepted) return;

    const done = await tryOrError(async () => {
      await clearImages();
      return true;
    }, 'Failed to reset the Editor');
    if (!done) return;

    clear();
    location.reload();
  });
}

function refreshCleanup() {
  const count = [...getCorrupt()].length;
  cleanup.classList.toggle('hidden', !count);
  cleanup.textContent = `Delete ${count} corrupt ${count === 1 ? 'entry' : 'entries'}`;
}

/** @param {import('../settings.js').Setting} setting */
function add({ key, name, enabled = false }) {
  const container = document.importNode(template.content, true);
  container.querySelector('.setting-name').innerHTML = name;

  const checkbox = container.querySelector('input');
  checkbox.checked = enabled;
  settings.on(key, (checked) => checkbox.checked = checked);

  checkbox.addEventListener('change', () => settings.set(key, checkbox.checked));

  settingsDiv.append(container);
}
