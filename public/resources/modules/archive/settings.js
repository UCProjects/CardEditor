import style from '../../styles/settings.css' with { type: 'css' };
import settings from '../settings.js';
import { adoptStyle } from '../utils/funcs.js';

adoptStyle(style);

/** @type {HTMLTemplateElement} */
const template = document.querySelector('template#setting');
/** @type {HTMLDivElement} */
const settingsDiv = document.querySelector('[data-page="settings"] div.settings');

export function load() {
  settings.getAll().forEach(add);
}

/** @param {import('../settings.js').Setting} setting */
function add({ checked: defaultEnabled = false, key, name, enabled = defaultEnabled }) {
  const container = document.importNode(template.content, true);
  container.querySelector('.setting-name').textContent = name;

  const checkbox = container.querySelector('input');
  checkbox.checked = enabled;
  settings.on(key, (checked) => checkbox.checked = checked);

  checkbox.addEventListener('change', () => settings.set(key, checkbox.checked));

  settingsDiv.append(container);
}
