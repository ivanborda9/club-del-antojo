import { db } from "./client";
import { products } from "./schema";

// Catálogo de golosinas. El costPrice es un placeholder (60% del precio de
// venta) — editalo con los valores reales desde /admin/productos. Las fotos
// se cargan producto por producto desde el admin.
const seedProducts = [
  // Chocolates
  { id: "cho-1", name: "Bon o Bon x1", category: "Chocolates", price: 1000, emoji: "🍫" },
  { id: "cho-2", name: "Cofler Bombón", category: "Chocolates", price: 1100, emoji: "🍫" },
  { id: "cho-3", name: "Milka Tableta 100g", category: "Chocolates", price: 3400, emoji: "🍫" },
  { id: "cho-4", name: "Chocolate Águila", category: "Chocolates", price: 1600, emoji: "🍫" },
  { id: "cho-5", name: "Block Chocolate Blanco", category: "Chocolates", price: 1500, emoji: "🍫" },
  { id: "cho-6", name: "Shot 3 Chocolates", category: "Chocolates", price: 1300, emoji: "🍫" },

  // Alfajores
  { id: "alf-1", name: "Alfajor Jorgito Blanco", category: "Alfajores", price: 1300, emoji: "🥮" },
  { id: "alf-2", name: "Alfajor Guaymallén Chocolate", category: "Alfajores", price: 1350, emoji: "🥮" },
  { id: "alf-3", name: "Alfajor Havanna Clásico", category: "Alfajores", price: 2400, emoji: "🥮" },
  { id: "alf-4", name: "Alfajor Capital Triple", category: "Alfajores", price: 1500, emoji: "🥮" },
  { id: "alf-5", name: "Alfajor Fantoche Cereal", category: "Alfajores", price: 1400, emoji: "🥮" },

  // Caramelos y chicles
  { id: "car-1", name: "Caramelos Media Hora x5", category: "Caramelos y Chicles", price: 950, emoji: "🍬" },
  { id: "car-2", name: "Chicles Beldent", category: "Caramelos y Chicles", price: 850, emoji: "🍬" },
  { id: "car-3", name: "Sugus x4", category: "Caramelos y Chicles", price: 900, emoji: "🍬" },
  { id: "car-4", name: "Caramelos Mogul Frutal", category: "Caramelos y Chicles", price: 750, emoji: "🍬" },
  { id: "car-5", name: "Chupetín Pico Dulce", category: "Caramelos y Chicles", price: 650, emoji: "🍭" },
  { id: "car-6", name: "Chicles Bubbaloo", category: "Caramelos y Chicles", price: 950, emoji: "🍬" },

  // Golosinas surtidas
  { id: "gol-1", name: "Turrón Arcor", category: "Golosinas Surtidas", price: 1050, emoji: "🍫" },
  { id: "gol-2", name: "Mantecol Individual", category: "Golosinas Surtidas", price: 1400, emoji: "🍯" },
  { id: "gol-3", name: "Palitos de la Selva", category: "Golosinas Surtidas", price: 1000, emoji: "🍫" },
  { id: "gol-4", name: "Rhodesia", category: "Golosinas Surtidas", price: 1600, emoji: "🍬" },
  { id: "gol-5", name: "Chocolinas Paquete", category: "Golosinas Surtidas", price: 2500, emoji: "🍪" },
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
