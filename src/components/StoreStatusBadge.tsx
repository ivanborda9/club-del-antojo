"use client";

import { useEffect, useState } from "react";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const POLL_MS = 60_000;

type BusinessHour = { daysOfWeek: string; startTime: string; endTime: string };
type StoreStatus = { open: boolean; hours: BusinessHour[] };

function formatHourRow(h: BusinessHour): string {
  const days = h.daysOfWeek
    .split(",")
    .map(Number)
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d])
    .join(", ");
  return `${days}: ${h.startTime} a ${h.endTime}`;
}

// Se actualiza solo cada un minuto para que no se quede mostrando
// "Abierto" después de la hora de cierre si el cliente dejó la pestaña
// abierta.
function useStoreStatus(): StoreStatus | null {
  const [status, setStatus] = useState<StoreStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      fetch("/api/store-status")
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) setStatus(data);
        })
        .catch(() => {
          // Sin datos, no mostramos nada en vez de un estado incorrecto.
        });
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return status;
}

// Franja chica y siempre visible (pensada para ir dentro de una barra
// sticky, junto al header) con si la tienda está atendiendo ahora mismo.
export function StoreStatusBar() {
  const status = useStoreStatus();
  if (!status) return null;

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-extrabold text-white ${
        status.open ? "bg-emerald-500" : "bg-zinc-800"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${status.open ? "bg-white" : "bg-red-400"}`} />
      {status.open ? "🟢 ABIERTO — Te estamos atendiendo" : "🔴 CERRADO en este momento"}
    </div>
  );
}

// Cartel con el detalle (mensaje + horarios) cuando está cerrada — pensado
// para ir en el flujo normal de la página, no en la barra sticky, para no
// ocupar pantalla de más mientras se hace scroll.
export function StoreClosedDetails() {
  const status = useStoreStatus();
  if (!status || status.open) return null;

  return (
    <div className="rounded-2xl border-2 border-zinc-800 bg-zinc-50 p-3 text-sm text-zinc-700">
      <p className="font-bold text-zinc-900">😴 En este momento no estamos atendiendo</p>
      <p className="mt-1 text-xs text-zinc-500">
        Podés seguir mirando la tienda, pero no vamos a poder tomar tu pedido hasta que
        volvamos a abrir.
      </p>
      {status.hours.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-zinc-600">
          {status.hours.map((h, i) => (
            <li key={i}>🕒 {formatHourRow(h)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Para las páginas que necesitan bloquear la compra (checkout, armar-box):
// mismo polling, solo devuelve si está abierta (null mientras carga).
export function useStoreOpen(): boolean | null {
  const status = useStoreStatus();
  return status?.open ?? null;
}
