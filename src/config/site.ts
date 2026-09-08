// Datos editables del negocio. Cambiá estos valores por los reales cuando los tengas.
export const siteConfig = {
  name: "Club del Antojo",
  tagline: "Kiosco online con envío a domicilio",
  city: "Tu Ciudad",
  deliveryNote: "Hacemos envíos únicamente dentro de Tu Ciudad. No hay retiro en local.",
  whatsappNumber: "5491100000000", // TODO: reemplazar por el número real (código de país + área, sin + ni espacios)
  bank: {
    holderName: "Nombre Apellido",
    alias: "clubdelantojo.mp", // TODO: reemplazar por el alias real
    cbu: "0000003100000000000000", // TODO: reemplazar por el CBU/CVU real
  },
  currency: "ARS",
  locale: "es-AR",
  // Zona horaria usada para los horarios de disponibilidad de productos.
  timezone: "America/Argentina/Buenos_Aires",
};

export function formatPrice(value: number): string {
  return new Intl.NumberFormat(siteConfig.locale, {
    style: "currency",
    currency: siteConfig.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildWhatsappOrderLink(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encoded}`;
}
