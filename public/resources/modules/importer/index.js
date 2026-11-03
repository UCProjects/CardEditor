import { removeClass } from '../utils/funcs.js';
import { openImport } from '../importDialog/index.js';
import { AUTO_HIDE_MS, error, toast } from '../toast/index.js';
import { inspect, parseBundle, unpack } from '../transfer.js';

/** @param {DragEvent} e */
function hasFiles(e) {
  return !!e.dataTransfer?.types.includes('Files');
}

/**
 * @param {HTMLElement} container
 * @param {(files: File[]) => void} drop
 */
export function initFileDrop(container, drop) {
  container.addEventListener('dragover', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    removeClass('drag-over');
    container.classList.add('drag-over');
  });
  container.addEventListener('dragleave', () => {
    container.classList.remove('drag-over');
  });
  container.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.stopPropagation();
    container.classList.remove('drag-over');
    drop([...e.dataTransfer.files]);
  });
}

/**
 * @param {HTMLButtonElement} button
 * @param {HTMLInputElement} input
 */
export function bindFilePicker(button, input) {
  button.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const [file] = input.files;
    input.value = '';
    if (!file) return;
    const bundle = parseBundle(await file.text());
    if (!bundle) {
      error({ body: `${file.name} is not editor data` });
      return;
    }
    openImport(bundle);
  });
}

/**
 * @param {File[]} files
 * @returns {Promise<import('../elements/BaseElement.js').default[]>} the new roots
 */
export async function importFiles(files) {
  const roots = [];
  for (const file of files) {
    const bundle = parseBundle(await file.text());
    if (!bundle) {
      error({ body: `${file.name} is not editor data` });
      continue;
    }
    try {
      const { elements, items } = inspect(bundle);
      roots.push(...await unpack(bundle));
      const existing = items.filter(({ exists }) => exists);
      const copies = existing.length ? `, ${existing.length} as copies` : '';
      toast({
        body: `Imported ${file.name} (${elements} elements${copies})`,
        signal: AbortSignal.timeout(AUTO_HIDE_MS),
      });
    } catch (err) {
      console.error(err);
      error({ body: `${file.name}: ${err.message}` });
    }
  }
  return roots;
}

document.addEventListener('paste', (e) => {
  if (e.target.closest?.('input, textarea, [contenteditable]') || document.querySelector('dialog[open]')) return;
  const bundle = parseBundle(e.clipboardData?.getData('text/plain'));
  if (!bundle) return;
  e.preventDefault();
  openImport(bundle);
});

document.addEventListener('dragover', (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'none';
});

document.addEventListener('drop', (e) => {
  if (hasFiles(e)) e.preventDefault();
});
