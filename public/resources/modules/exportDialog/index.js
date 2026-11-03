import { download } from '../utils/file.js';
import { loadStyle } from '../utils/funcs.js';
import { formatSize, preview } from '../utils/bundlePreview.js';
import { AUTO_HIDE_MS, toast, tryOrError } from '../toast/index.js';
import { pack } from '../transfer.js';

loadStyle('/resources/styles/dialog.css');

/** @type {HTMLDialogElement} */
const dialog = document.querySelector('#export');

/** @param {import('../elements/BaseElement.js').default} element */
export async function openExport(element) {
  const full = await tryOrError(() => pack(element), 'Failed to export');
  if (!full) return;

  /** @type {HTMLInputElement} */
  const assets = dialog.querySelector('input[name="assets"]');
  const images = dialog.querySelector('.images');
  const size = dialog.querySelector('.size');
  const output = dialog.querySelector('textarea');
  const hasImages = Object.keys(full.assets).length > 0;

  let text = '';

  function render() {
    const bundle = assets.checked ? full : { ...full, assets: {} };
    text = JSON.stringify(bundle);
    output.value = preview(bundle);
    size.textContent = formatSize(new Blob([text]).size);
  }

  assets.checked = false;
  images.classList.toggle('hidden', !hasImages);
  render();

  const controller = new AbortController();
  const options = { signal: controller.signal };
  dialog.addEventListener('close', () => controller.abort(), { once: true });

  assets.addEventListener('change', render, options);

  dialog.querySelector('.download').addEventListener('click', () => {
    download(text, `${element.name || element.type}.json`);
    dialog.close();
  }, options);

  dialog.querySelector('.copy').addEventListener('click', async () => {
    const copied = await tryOrError(async () => {
      await navigator.clipboard.writeText(text);
      return true;
    }, 'Failed to copy');
    if (!copied) return;
    toast({ body: 'Copied to clipboard', signal: AbortSignal.timeout(AUTO_HIDE_MS) });
    dialog.close();
  }, options);

  dialog.showModal();
}
