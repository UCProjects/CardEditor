import { tryOrError } from './toast/index.js';

export default function register() {
  return new Promise((res) => {
    window.addEventListener('load', async () => {
      if ('serviceWorker' in navigator) {
        await tryOrError(() => navigator.serviceWorker.register('/service-worker.js'));
      }
      res();
    });
  });
}
