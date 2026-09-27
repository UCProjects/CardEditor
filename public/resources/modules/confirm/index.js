import style from '../../styles/confirm.css' with { type: 'css' };
import { adoptStyle } from '../utils/funcs.js';

adoptStyle(style);

/** @type {HTMLDialogElement} */
const dialog = document.querySelector('#confirm');

/**
 * @param {{
 *  title?: string;
 *  body?: string;
 *  accept?: string;
 *  cancel?: string;
 *  destructive?: boolean;
 * }} options
 * @returns {Promise<boolean>}
 */
export default function confirm({
  title = '',
  body = '',
  accept = 'Confirm',
  cancel = 'Cancel',
  destructive = false,
} = {}) {
  dialog.classList.toggle('destructive', destructive);
  dialog.querySelector('h2').textContent = title;
  dialog.querySelector('p').textContent = body;
  dialog.querySelector('.accept').textContent = accept;
  dialog.querySelector('.cancel').textContent = cancel;
  dialog.returnValue = '';

  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'accept'), { once: true });
    dialog.showModal();
    dialog.querySelector('.cancel').focus();
  });
}
