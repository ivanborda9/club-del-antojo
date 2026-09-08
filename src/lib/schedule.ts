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
