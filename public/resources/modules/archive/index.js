import style from '../../styles/archive.css' with { type: 'css' };
import { adoptStyle } from '../utils/funcs.js';
import VarStore from '../utils/VarStore.js';
import { load as loadItems } from './elements.js';
import { load as loadImages } from './images.js';
import { load as loadSettings } from './settings.js';

export function load() {
  loadItems();
  loadImages();
  loadSettings();
}

adoptStyle(style);

/** @type {HTMLDivElement} */
const button = document.querySelector('.archive-button');
/** @type {HTMLDivElement} */
const archive = document.querySelector('.archive');

export function isOpen() {
  return archive.matches(':popover-open');
}

const { CloseWatcher } = window;
const closeWatcher = new VarStore();

archive.addEventListener('toggle', () => {
  const open = archive.matches(':popover-open');
  button.classList.toggle('hidden', open);
  closeWatcher.consume()?.destroy();
  if (!open || !CloseWatcher) return;
  const watcher = closeWatcher.set(new CloseWatcher());
  watcher.onclose = () => archive.hidePopover();
});

button.addEventListener('click', () => {
  archive.showPopover();
});

function setActive(page) {
  const el = archive.querySelector(`div[data-page="${page}"]`);
  if (el.matches('.active')) return;
  archive.querySelector('.active').classList.remove('active');
  el.classList.add('active');
}

archive.querySelectorAll('input[name="page"]').forEach((el) => {
  el.addEventListener('change', () => setActive(el.id));
});

document.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || !isOpen() || archive.contains(e.target) || e.target.closest('dialog')) return;
  archive.hidePopover();
});
