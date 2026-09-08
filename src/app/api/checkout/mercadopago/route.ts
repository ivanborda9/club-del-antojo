import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { products } from "@/data/products";

type OrderItem = { productId: string; quantity: number };

type CheckoutBody = {
  items: OrderItem[];
  buyer: { name: string; phone: string; address: string };
};

export async function POST(request: Request) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Mercado Pago no está configurado. Falta MP_ACCESS_TOKEN." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as CheckoutBody;

  if (!body.items?.length) {
    return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
  }

  // Recalculamos los precios desde el catálogo del servidor: nunca confiamos
  // en montos que vengan del cliente.
  const preferenceItems = body.items.map(({ productId, quantity }) => {
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error(`Producto desconocido: ${productId}`);
    return {
      id: product.id,
      title: product.name,
      quantity,
      unit_price: product.price,
      currency_id: siteConfig.currency,
    };
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  try {
    const result = await preference.create({
      body: {
        items: preferenceItems,
        payer: { name: body.buyer.name, phone: { number: body.buyer.phone } },
        back_urls: {
          success: `${siteUrl}/checkout/success`,
          failure: `${siteUrl}/checkout/failure`,
          pending: `${siteUrl}/checkout/pending`,
        },
        auto_return: "approved",
        statement_descriptor: siteConfig.name,
      },
    });

    return NextResponse.json({ initPoint: result.init_point });
  } catch {
    return NextResponse.json(
      { error: "No se pudo generar el pago con Mercado Pago." },
      { status: 502 }
    );
  }
}
