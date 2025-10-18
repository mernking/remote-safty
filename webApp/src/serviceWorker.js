import { Workbox } from 'workbox-window';

let workbox = null;

// Register the service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      workbox = new Workbox('/sw.js');

      workbox.addEventListener('installed', (event) => {
        if (event.isUpdate) {
          console.log('Service Worker updated');
          showUpdateNotification();
        } else {
          console.log('Service Worker installed for the first time');
        }
      });

      workbox.addEventListener('waiting', () => {
        console.log('Service Worker waiting');
        showUpdateNotification();
      });

      workbox.addEventListener('activated', (event) => {
        if (event.isUpdate) {
          console.log('Service Worker activated');
        }
      });

      await workbox.register();
      console.log('Service Worker registered successfully');

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_COMPLETED') {
          console.log('Background sync completed');
          // Trigger local sync context update
          window.dispatchEvent(new CustomEvent('backgroundSyncCompleted'));
        }

        if (event.data && event.data.type === 'SYNC_FAILED') {
          console.error('Background sync failed:', event.data.data.error);
          window.dispatchEvent(new CustomEvent('backgroundSyncFailed', {
            detail: event.data.data.error
          }));
        }

        if (event.data && event.data.type === 'SW_READY') {
          console.log('Service worker is ready');
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Unregister the service worker
export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('Service Worker unregistered');
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }
};

// Show update notification
const showUpdateNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('App Update Available', {
      body: 'A new version is available. Refresh to update.',
      icon: '/icon-192x192.png',
      tag: 'app-update'
    });
  }

  // Also show in-app notification
  const event = new CustomEvent('swUpdateAvailable');
  window.dispatchEvent(event);
};

// Skip waiting and activate new service worker
export const skipWaiting = () => {
  if (workbox) {
    workbox.messageSkipWaiting();
  }
};

// Get service worker version
export const getSWVersion = async () => {
  return new Promise((resolve) => {
    if (navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
    } else {
      resolve(null);
    }
  });
};

// Check if app is running from cache (offline capable)
export const isOfflineCapable = async () => {
  try {
    const response = await fetch('/manifest.json', { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};