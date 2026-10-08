"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Beep de alarma generado con Web Audio API (dos tonos, repetidos) — no
// depende de ningún archivo de audio.
function playAlarm() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const beep = (startAt: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + startAt);
      gain.gain.exponentialRampToValueAtTime(0.3, now + startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startAt + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startAt);
      osc.stop(now + startAt + 0.3);
    };

    // Tres pares de beeps (agudo-grave) para que llame la atención.
    for (let i = 0; i < 3; i++) {
      beep(i * 0.7, 880);
      beep(i * 0.7 + 0.15, 660);
    }

    setTimeout(() => ctx.close(), 2500);
  } catch {
    // Si el navegador bloquea el audio (sin interacción previa del
    // usuario todavía), el cartel visual sigue avisando igual.
  }
}

export function NewOrderAlert({ count }: { count: number }) {
  const [toast, setToast] = useState<number | null>(null);
  const prevCount = useRef<number | null>(null);

  useEffect(() => {
    if (prevCount.current !== null && count > prevCount.current) {
      const arrived = count - prevCount.current;
      setToast(arrived);
      playAlarm();
      const timer = setTimeout(() => setToast(null), 20000);
      return () => clearTimeout(timer);
    }
    prevCount.current = count;
  }, [count]);

  if (toast === null) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl bg-red-600 p-4 text-white shadow-lg">
        <span className="text-3xl animate-bounce">📬</span>
        <div className="flex-1">
          <p className="text-base font-extrabold">
            {toast === 1 ? "¡Pedido nuevo!" : `¡${toast} pedidos nuevos!`}
          </p>
          <Link
            href="/admin/pedidos?status=pagado"
            className="text-xs font-semibold underline underline-offset-2"
            onClick={() => setToast(null)}
          >
            Ver ahora
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setToast(null)}
          className="text-lg font-bold leading-none text-red-100"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  );
}
