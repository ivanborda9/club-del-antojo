"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "unsupported" | "off" | "on" | "denied" | "saving" | "error";
type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

const SETTINGS_STEPS: Record<Platform, string[]> = {
  ios: [
    "Abrí la app Ajustes del iPhone.",
    "Buscá \"Repartidores\" (o Safari) en la lista.",
    "Entrá a Notificaciones y activá \"Permitir notificaciones\".",
    "Si no aparece: borrá el ícono de la pantalla de inicio y volvé a agregarlo desde Safari (compartir → Agregar a inicio).",
  ],
  android: [
    "Tocá el candado 🔒 o el ícono (ⓘ) al lado de la dirección, arriba del navegador.",
    "Entrá a \"Permisos\" o \"Información del sitio\".",
    "Buscá \"Notificaciones\" y elegí \"Permitir\".",
    "Volvé acá y tocá \"Ya las activé\" abajo.",
  ],
  desktop: [
    "Hacé clic en el candado 🔒 junto a la dirección del sitio.",
    "Buscá \"Notificaciones\" y cambiala a \"Permitir\".",
    "Volvé acá y hacé clic en \"Ya las activé\" abajo.",
  ],
};

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
  const [showHelp, setShowHelp] = useState(false);
  const [platform] = useState<Platform>(() => detectPlatform());

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

  // Después de que el repartidor cambia el permiso a mano desde la
  // configuración del navegador, no hay forma de que la página se entere
  // sola — hay que volver a leer Notification.permission.
  async function revisarDeNuevo() {
    if (Notification.permission === "granted") {
      await activar();
    } else {
      setStatus(getInitialStatus(vapidPublicKey));
    }
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
        className={`flex h-11 w-11 items-center justify-center rounded-full border text-xl transition disabled:opacity-60 ${
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
        <div className="max-w-[260px] rounded-xl bg-amber-50 p-3 text-right text-xs text-amber-700">
          <p>🔕 Notificaciones bloqueadas para este sitio.</p>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="mt-1 font-semibold underline underline-offset-2"
          >
            {showHelp ? "Ocultar pasos" : "¿Cómo las activo?"}
          </button>

          {showHelp && (
            <div className="mt-2 text-left">
              <ol className="list-decimal space-y-1 pl-4">
                {SETTINGS_STEPS[platform].map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <button
                type="button"
                onClick={revisarDeNuevo}
                className="mt-2 w-full rounded-full bg-amber-600 py-1.5 text-center font-semibold text-white"
              >
                Ya las activé
              </button>
            </div>
          )}
        </div>
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
