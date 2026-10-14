"use client";

// Paleta vivaz que rota por categoría/categoría padre, para que las
// solapas llamen la atención (en vez de un solo color repetido). El orden
// importa: colores vecinos quedan bien distinguibles entre sí.
const PALETTE = [
  "from-pink-500 to-rose-500",
  "from-orange-500 to-amber-500",
  "from-violet-500 to-purple-500",
  "from-teal-500 to-emerald-500",
  "from-sky-500 to-blue-500",
  "from-fuchsia-500 to-pink-500",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
];

export function paletteFor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

type TopLevelItem = { label: string; emoji: string };

type Props = {
  // Nivel superior: categorías padre + categorías sueltas (sin padre), todas
  // mezcladas como solapas grandes y coloridas.
  topLevel: TopLevelItem[];
  activeTopLevel: string | null;
  onSelectTopLevel: (label: string | null) => void;
  // Subcategorías de la solapa padre elegida (vacío si la activa es una
  // categoría suelta o ninguna).
  subLevel: string[];
  activeSub: string | null;
  onSelectSub: (category: string | null) => void;
};

export function CategoryTabs({
  topLevel,
  activeTopLevel,
  onSelectTopLevel,
  subLevel,
  activeSub,
  onSelectSub,
}: Props) {
  return (
    <div className="border-b border-orange-100 bg-white/90 backdrop-blur">
      <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 py-3">
        {topLevel.map((item, i) => (
          <BigTab
            key={item.label}
            label={item.label}
            emoji={item.emoji}
            gradient={paletteFor(i)}
            isActive={activeTopLevel === item.label}
            // Tocar la que ya está activa la "destildá" (vuelve a ver todo),
            // ya que no hay botón "Todos" aparte.
            onClick={() => onSelectTopLevel(activeTopLevel === item.label ? null : item.label)}
          />
        ))}
      </div>

      {subLevel.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          <SubTab
            label="Todas"
            isActive={activeSub === null}
            onClick={() => onSelectSub(null)}
          />
          {subLevel.map((category) => (
            <SubTab
              key={category}
              label={category}
              isActive={activeSub === category}
              onClick={() => onSelectSub(category)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BigTab({
  label,
  emoji,
  gradient,
  isActive,
  onClick,
}: {
  label: string;
  emoji: string;
  gradient: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold tracking-tight transition active:scale-95 ${
        isActive
          ? `bg-gradient-to-br ${gradient} text-white shadow-md shadow-black/10`
          : "border-2 border-zinc-100 bg-white text-zinc-500 hover:border-zinc-200"
      }`}
    >
      <span className="text-lg leading-none">{emoji}</span>
      {label}
    </button>
  );
}

function SubTab({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
        isActive
          ? "bg-zinc-800 text-white"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}
