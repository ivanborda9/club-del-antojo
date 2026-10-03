"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "unsupported" | "off" | "on" | "denied" | "saving" | "error";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

// Estado inicial sincrónico: en el servidor (sin "window") queda en
// "checking" (no renderiza nada); recién en el cliente se puede resolver
// si el navegador soporta push o si el permiso ya está denegado.
function getInitialStatus(vapidPublicKey: string | null): Status {
  if (typeof window === "undefined") return "checking";
  if (!vapidPublicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  return "checking";
}

export function PushSubscribeButton({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const [status, setStatus] = useState<Status>(() => getInitialStatus(vapidPublicKey));

  useEffect(() => {
    if (status !== "checking") return;

    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "on" : "off");
    });
  }, [status]);

  async function activar() {
    if (!vapidPublicKey) return;
    setStatus("saving");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const json = subscription.toJSON();
      await fetch("/api/rider/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      setStatus("on");
    } catch {
      setStatus("error");
    }
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <p className="rounded-xl bg-zinc-100 p-3 text-xs text-zinc-500">
        Este navegador no admite notificaciones push. En iPhone: agregá esta página a la
        pantalla de inicio primero (compartir → &quot;Agregar a inicio&quot;) y volvé a entrar
        desde ahí.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
        Bloqueaste las notificaciones para este sitio. Activalas desde la configuración del
        navegador si querés recibir avisos de pedidos nuevos.
      </p>
    );
  }

  if (status === "on") {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-xs font-medium text-green-700">
        🔔 Notificaciones activadas
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={activar}
      disabled={status === "saving"}
      className="flex h-10 w-full items-center justify-center rounded-full border border-orange-300 bg-white text-sm font-semibold text-orange-700 disabled:opacity-60"
    >
      {status === "saving" ? "Activando..." : "🔔 Activar notificaciones de pedidos nuevos"}
    </button>
  );
}
