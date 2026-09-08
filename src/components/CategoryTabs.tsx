"use client";

type Props = {
  categories: string[];
  active: string | null;
  onSelect: (category: string | null) => void;
};

export function CategoryTabs({ categories, active, onSelect }: Props) {
  return (
    <div className="sticky top-[65px] z-20 flex gap-2 overflow-x-auto border-b border-orange-100 bg-orange-50/90 px-4 py-2 backdrop-blur [scrollbar-width:none]">
      <TabButton label="Todos" isActive={active === null} onClick={() => onSelect(null)} />
      {categories.map((category) => (
        <TabButton
          key={category}
          label={category}
          isActive={active === category}
          onClick={() => onSelect(category)}
        />
      ))}
    </div>
  );
}

function TabButton({
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
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        isActive
          ? "bg-orange-600 text-white"
          : "bg-white text-zinc-600 border border-orange-200"
      }`}
    >
      {label}
    </button>
  );
}
