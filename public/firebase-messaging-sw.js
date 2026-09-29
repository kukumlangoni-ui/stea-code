self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "STEA";
  const body = notification.body || data.body || "You have a new STEA update.";
  const icon = notification.icon || data.icon || "/stea-brand/stea-s-logo-transparent-512.png?v=20260621-splashfix";
  const targetUrl = data.url || data.link || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: "/stea-brand/stea-s-logo-transparent-512.png?v=20260621-splashfix",
      data: { url: targetUrl },
      vibrate: [80, 40, 80],
      actions: [{ action: "open", title: "Open STEA" }],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  const absoluteUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === absoluteUrl && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(absoluteUrl);
      return undefined;
    })
  );
});
