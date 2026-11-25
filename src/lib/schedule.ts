import { siteConfig } from "@/config/site";

// Hora actual en la zona horaria de la tienda, como "HH:MM" (24hs).
export function getCurrentLocalTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: siteConfig.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

// Día de la semana actual en la zona horaria de la tienda: 0=domingo..6=sábado.
export function getCurrentLocalDayOfWeek(date: Date = new Date()): number {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: siteConfig.timezone,
    weekday: "short",
  }).format(date);
  return WEEKDAY_INDEX[label] ?? date.getDay();
}

// Un producto sin horario configurado siempre está disponible (según su
// flag "active"). Con horario, soporta rangos que cruzan la medianoche
// (ej: 22:00 a 06:00 para disponibilidad nocturna).
export function isWithinSchedule(
  start: string | null,
  end: string | null,
  now: string = getCurrentLocalTime()
): boolean {
  if (!start || !end) return true;
  if (start === end) return true; // rango de 24hs
  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
}
