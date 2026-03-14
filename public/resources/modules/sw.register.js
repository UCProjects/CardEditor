export default function register() {
  return new Promise((res) => {
    window.addEventListener('load', async () => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/service-worker.js');
      }
      res();
    });
  });
}
