// Service worker para las notificaciones push de repartidores. No cachea
// nada más: el sitio se sigue sirviendo normal, esto solo escucha push.

self.addEventListener("push", (event) => {
  let data = { title: "Club del Antojo", body: "Tenés una novedad.", url: "/rider" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // payload no es JSON válido, usamos el default
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/rider";

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window" });
      const existing = clientsList.find((c) => c.url.includes(url));
      if (existing) {
        existing.focus();
      } else {
        self.clients.openWindow(url);
      }
    })()
  );
});
