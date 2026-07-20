// Service Worker for Smart Poultry PWA - Background Notifications support
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Store scheduled notifications in an array
let scheduledNotifs = [];

function checkScheduledNotifications() {
  const now = Date.now();
  scheduledNotifs = scheduledNotifs.filter(item => {
    if (now >= item.time) {
      // Trigger notification
      self.registration.showNotification(item.title, {
        body: item.body,
        icon: '/assets/icon.png',
        vibrate: [200, 100, 200],
        badge: '/assets/icon.png',
        tag: item.tag || 'poultry-alert',
        data: { url: '/' }
      });
      return false; // Remove from list
    }
    return true; // Keep in list
  });
}

// Background poll timer (while SW is active in memory)
setInterval(checkScheduledNotifications, 10000);

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    // Show notification immediately (even if backgrounded)
    const { title, body, tag } = event.data;
    self.registration.showNotification(title, {
      body: body,
      icon: '/assets/icon.png',
      vibrate: [200, 100, 200],
      badge: '/assets/icon.png',
      tag: tag || 'poultry-alert',
      data: { url: '/' }
    });
  } else if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    // Schedule a future notification
    const { title, body, time, tag } = event.data;
    if (time > Date.now()) {
      // Avoid duplicate schedules for same tag
      scheduledNotifs = scheduledNotifs.filter(item => item.tag !== tag);
      scheduledNotifs.push({ title, body, time, tag });
    }
  } else if (event.data.type === 'CLEAR_SCHEDULED_NOTIFICATIONS') {
    scheduledNotifs = [];
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
