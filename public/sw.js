/* eslint-disable no-restricted-globals */
// Hotmart Notify – Service Worker para Web Push real

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Venda realizada", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Venda realizada";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-512.png",
    badge: "/icon-512.png",
    vibrate: [15, 40, 15],
    tag: data.tag || "hotmart-sale",
    renotify: true,
    timestamp: Date.now(),
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
