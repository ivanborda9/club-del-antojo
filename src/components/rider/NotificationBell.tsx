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

export function NotificationBell({ vapidPublicKey }: { vapidPublicKey: string | null }) {
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

  async function desactivar() {
    setStatus("saving");
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/rider/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setStatus("off");
    } catch {
      setStatus("error");
    }
  }

  function toggle() {
    if (status === "on") desactivar();
    else if (status === "off" || status === "error") activar();
  }

  if (status === "checking") return null;

  const isOn = status === "on";
  const isBusy = status === "saving";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isBusy || status === "unsupported" || status === "denied"}
        title={isOn ? "Desactivar notificaciones" : "Activar notificaciones"}
        className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg transition disabled:opacity-60 ${
          isOn
            ? "border-orange-300 bg-orange-50 text-orange-600"
            : "border-zinc-200 bg-zinc-100 text-zinc-400"
        }`}
      >
        {isOn ? "🔔" : "🔕"}
      </button>

      {status === "unsupported" && (
        <p className="max-w-[220px] rounded-xl bg-zinc-100 p-2 text-right text-xs text-zinc-500">
          Este navegador no admite notificaciones. En iPhone: agregá la página a la pantalla de
          inicio primero.
        </p>
      )}

      {status === "denied" && (
        <p className="max-w-[220px] rounded-xl bg-amber-50 p-2 text-right text-xs text-amber-700">
          🔕 Notificaciones bloqueadas. Activalas desde la configuración del navegador.
        </p>
      )}

      {status === "off" && (
        <p className="max-w-[220px] rounded-xl bg-amber-50 p-2 text-right text-xs text-amber-700">
          🔕 Notificaciones desactivadas. No te vas a enterar de pedidos nuevos.
        </p>
      )}

      {status === "error" && (
        <p className="max-w-[220px] rounded-xl bg-red-50 p-2 text-right text-xs text-red-700">
          No se pudo actualizar. Probá de nuevo.
        </p>
      )}
    </div>
  );
}
