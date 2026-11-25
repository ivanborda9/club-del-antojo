import webpush from "web-push";
import {
  deleteAdminPushSubscriptionByEndpoint,
  deletePushSubscriptionByEndpoint,
  getAllAdminPushSubscriptions,
  getPushSubscriptionsForActiveRiders,
} from "@/lib/db/queries";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:contacto@clubdelantojo.com";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

// Avisa a todos los repartidores activos que hay un pedido nuevo esperando
// en el pool. Si las claves VAPID no están configuradas, no hace nada (la
// app sigue funcionando con el refresco automático cada 15s).
export async function notifyRidersOfNewOrder(): Promise<void> {
  if (!publicKey || !privateKey) return;

  const subscriptions = await getPushSubscriptionsForActiveRiders();
  if (!subscriptions.length) return;

  const payload = JSON.stringify({
    title: "Nuevo pedido disponible",
    body: "Hay un pedido esperando reparto. Abrí la app para aceptarlo.",
    url: "/rider",
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
      } catch (err: unknown) {
        // 404/410: la suscripción ya no es válida (navegador desinstalado,
        // permiso revocado, etc.) — la borramos para no seguir intentando.
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscriptionByEndpoint(sub.endpoint);
        }
      }
    })
  );
}

// Avisa al celular de quien tenga el panel admin abierto con notificaciones
// activadas (dueño/a y/o encargado/a) que entró un pedido nuevo, sin
// depender de tener la pestaña abierta — esto es lo que evita que al
// encargado/a se le pase un pedido por alto.
export async function notifyAdminsOfNewOrder(): Promise<void> {
  if (!publicKey || !privateKey) return;

  const subscriptions = await getAllAdminPushSubscriptions();
  if (!subscriptions.length) return;

  const payload = JSON.stringify({
    title: "Nuevo pedido",
    body: "Entró un pedido nuevo. Abrí el panel para verlo.",
    url: "/admin/pedidos",
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await deleteAdminPushSubscriptionByEndpoint(sub.endpoint);
        }
      }
    })
  );
}
