import { NextResponse } from "next/server";
import { getRiderSession } from "@/lib/riderAuth";
import { deletePushSubscriptionByEndpoint, savePushSubscription } from "@/lib/db/queries";

type SubscriptionPayload = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

function isValidSubscription(value: unknown): value is SubscriptionPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.endpoint !== "string" || !v.endpoint) return false;
  const keys = v.keys as Record<string, unknown> | undefined;
  return !!keys && typeof keys.p256dh === "string" && typeof keys.auth === "string";
}

export async function POST(request: Request): Promise<NextResponse> {
  const riderId = await getRiderSession();
  if (!riderId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidSubscription(body)) {
    return NextResponse.json({ error: "Suscripción inválida." }, { status: 400 });
  }

  await savePushSubscription({
    riderId,
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const riderId = await getRiderSession();
  if (!riderId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint = (body as { endpoint?: unknown })?.endpoint;
  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ error: "Falta el endpoint." }, { status: 400 });
  }

  await deletePushSubscriptionByEndpoint(endpoint);
  return NextResponse.json({ ok: true });
}
