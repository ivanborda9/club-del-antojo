import { siteConfig } from "@/config/site";

// Argentina no aplica horario de verano desde 2009: UTC-3 todo el año.
const AR_OFFSET_HOURS = 3;

// Fecha calendario ("YYYY-MM-DD") en horario argentino.
export function getArgentinaDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: siteConfig.timezone }).format(date);
}

// Convierte un rango de días calendario argentinos (inclusive) a instantes
// UTC, para comparar contra timestamps guardados en la base (siempre UTC).
export function argentinaDateRangeToUTC(fromYMD: string, toYMD: string) {
  const start = new Date(`${fromYMD}T00:00:00.000Z`);
  start.setUTCHours(start.getUTCHours() + AR_OFFSET_HOURS);

  const endDayStart = new Date(`${toYMD}T00:00:00.000Z`);
  endDayStart.setUTCHours(endDayStart.getUTCHours() + AR_OFFSET_HOURS);
  const end = new Date(endDayStart.getTime() + 24 * 60 * 60 * 1000 - 1000);

  return { start, end };
}

// Límites UTC del "hoy" argentino, para reportes tipo "ventas de hoy".
export function getArgentinaTodayBoundsUTC(date: Date = new Date()) {
  const ymd = getArgentinaDateString(date);
  return argentinaDateRangeToUTC(ymd, ymd);
}

// Formatea una fecha/hora (guardada en UTC) en horario argentino, para
// mostrar a el/la dueño/a del negocio sin importar la zona del navegador.
export function formatArgentinaDateTime(value: string | Date): string {
  // orders.created_at viene de SQLite como "YYYY-MM-DD HH:MM:SS" (UTC, sin
  // sufijo). Sin la "Z", algunos motores JS lo interpretan como hora local
  // en vez de UTC — se la agregamos para que siempre se lea como UTC.
  const normalized =
    typeof value === "string" && !value.includes("T") && !value.endsWith("Z")
      ? `${value.replace(" ", "T")}Z`
      : value;
  return new Date(normalized).toLocaleString(siteConfig.locale, {
    timeZone: siteConfig.timezone,
    hour12: false,
  });
}
