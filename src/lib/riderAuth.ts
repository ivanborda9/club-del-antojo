import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "rider_session";
const SESSION_DAYS = 30;

// Reutiliza el mismo secreto que la sesión de admin: son cookies distintas
// (nombre distinto, payload distinto), no hay riesgo de mezclarlas.
function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Falta ADMIN_SESSION_SECRET en las variables de entorno.");
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function buildToken(riderId: string): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${riderId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

function parseToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [riderId, expiresStr, signature] = parts;
  const payload = `${riderId}.${expiresStr}`;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() >= expires) return null;
  return riderId;
}

export async function createRiderSession(riderId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, buildToken(riderId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroyRiderSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// Devuelve el id del repartidor logueado, o null si no hay sesión válida.
export async function getRiderSession(): Promise<string | null> {
  const store = await cookies();
  return parseToken(store.get(COOKIE_NAME)?.value);
}
