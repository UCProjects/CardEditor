import app, { loadStorage } from './UndercardEditor.js';
import serviceWorker from './sw.register.js';
import { ready as keywords } from './keywords.js';
import { ready as images } from './imageBank.js';
import { error as errorToast } from './toast/index.js';
import { load as loadStatus } from './status.js';

const preloads = [
  serviceWorker(),
  keywords,
  loadStatus(),
  images,
  loadStorage(),
];

function ready() {
  document.querySelectorAll('[legacy], #loading').forEach((el) => el.remove());
  document.querySelector('#draggable-live-region')?.remove(); // This is from draggable

  document.querySelectorAll('[data-template]').forEach((el) => {
    const template = el.dataset.template;
    el.innerHTML = document.getElementById(template)?.innerHTML ?? `Failed to load '${template}'`;
  });

  document.querySelector('#changelog-toggle').addEventListener('click', () => app.versionToast(true));

  app.init();
}

Promise.all(preloads)
  .then(ready)
  .catch((err) => {
    console.error(err);
    errorToast({ body: 'Failed to load Editor' });
  });
