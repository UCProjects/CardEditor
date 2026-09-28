import { tryOrError } from './toast/index.js';

async function unregister() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
  if (!('caches' in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

export default function register() {
  return new Promise((res) => {
    window.addEventListener('load', async () => {
      if ('serviceWorker' in navigator) {
        if (location.protocol === 'https:') {
          await tryOrError(() => navigator.serviceWorker.register('/service-worker.js'));
        } else {
          await tryOrError(unregister, 'Failed to remove the service worker');
        }
      }
      res();
    });
  });
}
