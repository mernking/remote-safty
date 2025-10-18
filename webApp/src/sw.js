importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { NetworkFirst, CacheFirst, StaleWhileRevalidate } = workbox.strategies;
const { precacheAndRoute } = workbox.precaching;
const { ExpirationPlugin } = workbox.expiration;

// Precache static assets
precacheAndRoute([
  { url: '/', revision: null },
  { url: '/manifest.json', revision: null },
  { url: '/vite.svg', revision: null },
  // Add other static assets as needed
]);

// Cache API routes with network-first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// Cache images with cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Cache fonts and other assets
registerRoute(
  ({ request }) => request.destination === 'font' ||
                   request.destination === 'script' ||
                   request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Background sync for offline operations
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('syncQueue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours
  onSync: async ({ queue }) => {
    console.log('Background sync triggered');

    try {
      // Get all pending operations from IndexedDB
      const pendingOps = await getPendingSyncOperations();

      for (const op of pendingOps) {
        try {
          const response = await fetch('/api/v1/sync/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientId: 'web-client-bg',
              ops: [op]
            }),
          });

          if (response.ok) {
            // Mark operation as completed in IndexedDB
            await markSyncComplete(op.opId);
          } else {
            throw new Error(`Sync failed: ${response.status}`);
          }
        } catch (error) {
          console.error('Background sync operation failed:', error);
          // Operation will be retried
        }
      }

      // Notify the app that sync completed
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETED',
          data: { success: true }
        });
      });

    } catch (error) {
      console.error('Background sync failed:', error);

      // Notify the app of sync failure
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_FAILED',
          data: { error: error.message }
        });
      });
    }
  }
});

// Register background sync for sync operations
registerRoute(
  ({ url }) => url.pathname === '/api/v1/sync/push',
  new NetworkFirst({
    cacheName: 'sync-api',
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

// Handle service worker messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }
});

// Handle push notifications (for future implementation)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.message,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id
      },
      actions: [
        {
          action: 'view',
          title: 'View',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions to interact with IndexedDB (simplified for service worker context)
async function getPendingSyncOperations() {
  // This would need to be implemented to access IndexedDB from service worker
  // For now, return empty array - the main app handles sync
  return [];
}

async function markSyncComplete(opId) {
  // Implementation would go here
}

// Install event
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(
    self.clients.claim().then(() => {
      // Notify clients that service worker is ready
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_READY'
          });
        });
      });
    })
  );
});