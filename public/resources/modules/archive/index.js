import style from '../../styles/archive.css' with { type: 'css' };
import { adoptStyle } from '../utils/funcs.js';
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

archive.addEventListener('toggle', () => {
  button.classList.toggle('hidden', archive.matches(':popover-open'));
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
