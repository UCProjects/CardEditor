import { toPng } from 'https://ga.jspm.io/npm:html-to-image@1.11.13/es/index.js';
import { tryOrError } from '../toast/index.js';
import { loadStyle } from '../utils/funcs.js';

loadStyle('/resources/styles/saving.css');

export default async function saveImage(element, as) {
  element.classList.add('saving');
  const url = await tryOrError(
    () => toPng(element, { filter, backgroundColor: 'var(--background)' }),
    'Failed to generate image',
  );
  element.classList.remove('saving');
  if (!url) return;
  const link = document.createElement('a');
  link.download = `${as || 'undercard'}.png`;
  link.href = url;
  link.click();
}

function filter(node) {
  return !node.classList?.contains('no-save') && (node.nodeName !== 'IMG' || new URL(node.src).pathname !== '/');
}
