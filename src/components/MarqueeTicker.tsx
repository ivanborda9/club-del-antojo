import type { MarqueeMessageRow } from "@/lib/db/schema";

// Velocidad: más o menos constante en píxeles por segundo, así un texto
// largo no pasa corriendo ni uno corto se hace eterno.
const PIXELS_PER_SECOND = 60;

export function MarqueeTicker({ messages }: { messages: MarqueeMessageRow[] }) {
  if (messages.length === 0) return null;

  const joined = messages.map((m) => m.text).join("   •   ");
  // Estimación simple del ancho para calcular la duración de la animación
  // (no hace falta ser exacto, solo que la velocidad se sienta pareja).
  const estimatedWidth = joined.length * 9;
  const durationSeconds = Math.max(8, estimatedWidth / PIXELS_PER_SECOND);

  return (
    <div className="overflow-hidden whitespace-nowrap bg-zinc-900 py-1.5">
      <div
        className="marquee-track inline-flex"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        <span className="px-4 text-xs font-semibold text-white">{joined}</span>
        <span className="px-4 text-xs font-semibold text-white" aria-hidden="true">
          {joined}
        </span>
      </div>
    </div>
  );
}
