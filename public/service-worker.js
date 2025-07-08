// Thrive App Service Worker
// Version: 1.0.0
// Provides offline functionality, caching, and background sync

const CACHE_VERSION = 'thrive-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/offline.html',
  '/manifest.json',
  // '/icon-192x192.png', // TODO: Add icon files
  // '/icon-512x512.png', // TODO: Add icon files
  '/illustrations/companion.png',
  '/illustrations/journey_story_illustration.png',
  '/illustrations/routine.png',
  '/illustrations/recommend_supplements.png',
  '/illustrations/privacy.png',
  '/illustrations/pantry.png'
];

// Routes to prefetch for faster navigation
const PREFETCH_ROUTES = [
  '/thrivings',
  '/journeys',
  '/pantry',
  '/settings',
  '/chat-history'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[Service Worker] Caching static assets');
        // Add files one by one with error handling
        return Promise.all(
          STATIC_FILES.map(file => 
            cache.add(file).catch(err => {
              console.warn(`[Service Worker] Failed to cache ${file}:`, err);
            })
          )
        );
      }),
      // Prefetch common routes
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('[Service Worker] Prefetching routes');
        return Promise.all(
          PREFETCH_ROUTES.map(route => 
            fetch(route).then(response => {
              if (response.status === 200) {
                return cache.put(route, response);
              }
            }).catch(() => {})
          )
        );
      })
    ])
  );
  // Force new service worker to activate
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    Promise.all([
      // Enable navigation preloading for faster page loads
      self.registration.navigationPreload?.enable(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('thrive-') && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== IMAGE_CACHE)
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
    ])
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extensions and non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle API requests differently - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Try to serve from cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Handle images - cache first, long TTL
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // Return offline placeholder image if available
          return caches.match('/offline-image.svg');
        });
      })
    );
    return;
  }

  // Handle navigation requests with preloading
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Use preloaded response if available
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            // Cache the preloaded response
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, preloadResponse.clone());
            return preloadResponse;
          }

          // Try network first for navigation
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Fall back to cache
          const cachedResponse = await caches.match(request);
          return cachedResponse || caches.match('/offline.html');
        }
      })()
    );
    return;
  }

  // Handle all other requests - stale-while-revalidate strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      });

      // Return cached response immediately, or wait for network
      return cachedResponse || fetchPromise;
    }).catch(() => {
      // If both cache and network fail, show offline page
      if (request.destination === 'document') {
        return caches.match('/offline.html');
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-thrivings') {
    event.waitUntil(syncThrivings());
  } else if (event.tag === 'sync-journal-entries') {
    event.waitUntil(syncJournalEntries());
  } else if (event.tag === 'sync-pantry-items') {
    event.waitUntil(syncPantryItems());
  }
});

// Push notifications (privacy-focused, opt-in)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/illustrations/companion.png', // Using companion as temporary icon
    badge: '/illustrations/companion.png', // TODO: Add proper badge icon
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey,
      type: data.type
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle specific actions
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for background sync
async function syncThrivings() {
  // Implementation will connect to IndexedDB to sync pending changes
  console.log('[Service Worker] Syncing thrivings...');
  // TODO: Implement after IndexedDB migration
}

async function syncJournalEntries() {
  // Implementation will connect to IndexedDB to sync pending entries
  console.log('[Service Worker] Syncing journal entries...');
  // TODO: Implement after IndexedDB migration
}

async function syncPantryItems() {
  // Implementation will connect to IndexedDB to sync pending items
  console.log('[Service Worker] Syncing pantry items...');
  // TODO: Implement after IndexedDB migration
}

function handleNotificationAction(action, data) {
  // Handle different notification actions
  switch (action) {
    case 'view':
      clients.openWindow(`/${data.type}/${data.primaryKey}`);
      break;
    case 'dismiss':
      // Just close, already handled
      break;
    default:
      clients.openWindow('/');
  }
}

// Message handler for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});