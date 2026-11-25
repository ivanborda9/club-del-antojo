import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_DAYS = 7;

// "owner": acceso completo (ganancias, reportes, configuración de precios,
// etc). "staff" (el/la encargado/a del día a día): solo lo operativo —
// pedidos, stock, repartidores y abrir/cerrar la tienda. Qué rutas puede
// ver cada uno se controla en src/proxy.ts.
export type AdminRole = "owner" | "staff";

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Falta ADMIN_SESSION_SECRET en las variables de entorno.");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function buildAdminToken(role: AdminRole): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${expires}|${role}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

// Puro (sin tocar cookies()): así lo puede usar tanto el server como
// src/proxy.ts, que recibe las cookies directo del request.
export function parseAdminToken(token: string | undefined): AdminRole | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!constantTimeEqual(signature, sign(payload))) return null;

  const [expiresStr, role] = payload.split("|");
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() >= expires) return null;
  if (role !== "owner" && role !== "staff") return null;
  return role;
}

// Devuelve el rol si la contraseña coincide con alguna de las dos
// configuradas (ADMIN_PASSWORD = dueño/a, STAFF_PASSWORD = encargado/a).
export function checkAdminCredentials(password: string): AdminRole | null {
  const ownerPassword = process.env.ADMIN_PASSWORD;
  if (ownerPassword && constantTimeEqual(password, ownerPassword)) return "owner";

  const staffPassword = process.env.STAFF_PASSWORD;
  if (staffPassword && constantTimeEqual(password, staffPassword)) return "staff";

  return null;
}

export async function createAdminSession(role: AdminRole): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, buildAdminToken(role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}

export async function getAdminRole(): Promise<AdminRole | null> {
  const store = await cookies();
  return parseAdminToken(store.get(ADMIN_COOKIE_NAME)?.value);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminRole()) !== null;
}
