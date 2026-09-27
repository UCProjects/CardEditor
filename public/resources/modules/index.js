import app, { loadStorage } from './UndercardEditor.js';
import serviceWorker from './sw.register.js';
import { ready as keywords } from './keywords.js';
import { ready as images } from './imageBank.js';
import { error as errorToast } from './toast/index.js';
import { load as loadStatus } from './status.js';
import { load as loadCustomEffects } from './customEffects.js';

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

  loadCustomEffects();

  document.querySelector('#changelog-toggle').addEventListener('click', () => app.versionToast(true));

  app.init();
}

function failed(...errors) {
  errors.forEach((error) => console.error(error));
  errorToast({ body: 'Failed to load Editor' });
}

Promise.allSettled(preloads)
  .then((results) => {
    const errors = results
      .filter(({ status }) => status === 'rejected')
      .map(({ reason }) => reason);
    if (errors.length) return failed(...errors);
    return ready();
  })
  .catch(failed);
