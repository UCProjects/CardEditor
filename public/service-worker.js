importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

workbox.setConfig({
  debug: new URLSearchParams(location.search).has('debug'),
});

workbox.core.setCacheNameDetails({
  prefix: 'undercard-editor',
});

// Cache index
workbox.routing.registerRoute(
  /index\.html$|\/$/,
  new workbox.strategies.NetworkFirst(),
);

// Cache local files
workbox.routing.registerRoute(
  /\.(?:js|css|json)$/,
  new workbox.strategies.StaleWhileRevalidate(),
);

// Cache 3rd party files
workbox.routing.registerRoute(
  ({ url }) => [
    'unpkg.com',
    'cdnjs.cloudflare.com',
    'ga.jspm.io',
  ].includes(url.host),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'external',
  }),
);

// Cache images
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  }),
);

// Offline analytics
workbox.googleAnalytics.initialize();

// Cache the Google Fonts stylesheets with a stale while revalidate strategy.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  }),
);

// Cache the Google Fonts webfont files with a cache first strategy for 1 year.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  new workbox.strategies.CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.Plugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

workbox.routing.registerRoute(
  /.otf$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'undercards-webfonts',
    plugins: [
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.Plugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
);
