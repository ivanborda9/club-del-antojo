import { db } from "./client";
import { products } from "./schema";

// Catálogo inicial de ejemplo. El costPrice es un placeholder (60% del
// precio de venta) — editalo con los valores reales desde /admin/productos.
const seedProducts = [
  { id: "gol-1", name: "Alfajor Jorgito Blanco", category: "Golosinas", price: 1200, emoji: "🍫" },
  { id: "gol-2", name: "Chocolate Águila", category: "Golosinas", price: 1500, emoji: "🍫" },
  { id: "gol-3", name: "Caramelos Media Hora x5", category: "Golosinas", price: 900, emoji: "🍬" },
  { id: "gol-4", name: "Chicles Beldent", category: "Golosinas", price: 800, emoji: "🍬" },
  { id: "gol-5", name: "Turrón Arcor", category: "Golosinas", price: 1000, emoji: "🍫" },

  { id: "beb-1", name: "Coca-Cola 500ml", category: "Bebidas", price: 2200, emoji: "🥤" },
  { id: "beb-2", name: "Agua Mineral 500ml", category: "Bebidas", price: 1300, emoji: "💧" },
  { id: "beb-3", name: "Jugo Cepita 200ml", category: "Bebidas", price: 1100, emoji: "🧃" },
  { id: "beb-4", name: "Gatorade 500ml", category: "Bebidas", price: 2400, emoji: "🥤" },
  { id: "beb-5", name: "Cerveza Quilmes 473ml", category: "Bebidas", price: 2600, emoji: "🍺" },
  { id: "beb-6", name: "Energizante Speed 473ml", category: "Bebidas", price: 2800, emoji: "🥤" },

  { id: "sna-1", name: "Papas Lays 100g", category: "Snacks", price: 2100, emoji: "🍟" },
  { id: "sna-2", name: "Doritos 100g", category: "Snacks", price: 2200, emoji: "🌽" },
  { id: "sna-3", name: "Maní Salado 100g", category: "Snacks", price: 1400, emoji: "🥜" },
  { id: "sna-4", name: "Palitos Salados 100g", category: "Snacks", price: 1300, emoji: "🥨" },

  { id: "cig-1", name: "Marlboro Box x20", category: "Cigarrillos", price: 4800, emoji: "🚬" },
  { id: "cig-2", name: "Philip Morris x20", category: "Cigarrillos", price: 4600, emoji: "🚬" },

  { id: "hel-1", name: "Palito Bombón Helado", category: "Helados", price: 1800, emoji: "🍦" },
  { id: "hel-2", name: "Copa Helada 250ml", category: "Helados", price: 2400, emoji: "🍨" },

  { id: "alm-1", name: "Pan Lactal", category: "Almacén", price: 2000, emoji: "🍞" },
  { id: "alm-2", name: "Huevos x6", category: "Almacén", price: 2500, emoji: "🥚" },
  { id: "alm-3", name: "Fideos 500g", category: "Almacén", price: 1600, emoji: "🍝" },
  { id: "alm-4", name: "Yerba Mate 500g", category: "Almacén", price: 3200, emoji: "🧉" },
];

async function main() {
  await db.delete(products);
  await db.insert(products).values(
    seedProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      emoji: p.emoji,
      salePrice: p.price,
      costPrice: Math.round(p.price * 0.6),
      stock: 20,
      lowStockThreshold: 5,
      active: true,
    }))
  );
  console.log(`Seed listo: ${seedProducts.length} productos cargados.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
