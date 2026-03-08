import app, { loadStorage } from './UndercardEditor.js';
import serviceWorker from './sw.register.js';
import { ready as effects } from './effects.js';

const preloads = [
  serviceWorker(),
  effects,
  loadStorage(),
];

function ready() {
  document.querySelectorAll('[legacy], #loading').forEach((el) => el.remove());
  document.querySelector('#draggable-live-region').remove();

  // TODO Load templates

  app.init();
}

Promise.all(preloads)
  .then(ready)
  .catch(console.error);
