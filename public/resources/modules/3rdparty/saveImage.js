import { toPng } from 'https://ga.jspm.io/npm:html-to-image@1.11.13/es/index.js';
import style from '../../styles/saving.css' with { type: 'css' };
import { tryOrError } from '../toast/index.js';
import { adoptStyle } from '../utils/funcs.js';

adoptStyle(style);

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
