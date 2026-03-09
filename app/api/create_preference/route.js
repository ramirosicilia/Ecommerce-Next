import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";


const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: { timeout: 40000 }
});

const preference = new Preference(client);

export async function POST(req) {

  try {

    const { mp } = await req.json();

    if (!Array.isArray(mp) || mp.length === 0) {
      return NextResponse.json({ error: "No hay productos en la compra." }, { status: 400 });
    }

    for (const item of mp) {
      if (!item.id) {
        return NextResponse.json({ error: "Algún producto no tiene id." }, { status: 400 });
      }
    }

    const userId = mp[0]?.user_id;

    if (!userId) {
      return NextResponse.json({ error: "user_id no proporcionado" }, { status: 400 });
    }

    const carritoFormateado = mp.map(item => ({
      producto_id: item.producto_id,
      color_nombre: item.color_nombre,
      talle_nombre: item.talle_nombre,
      cantidad: item.quantity,
      unit_price: item.unit_price,
      currency_id: "ARS",
    }));

    const total = mp.reduce(
      (acc, item) => acc + (Number(item.unit_price) * Number(item.quantity)),
      0
    );

    const externalReference = uuidv4();

    const preferenceBody = {
      external_reference: externalReference,
      items: mp.map(item => ({
        id: item.producto_id,
        title: item.name,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price)
      })),

      metadata: {
        carrito: carritoFormateado,
        user_id: userId,
        total
      },

      notification_url: `${process.env.URL_PAYMENTS}/api/orden`,

      back_urls: {
        success: "https://personaldegastronomia.com",
        failure: `https://personaldegastronomia.com/`,
        pending: `https://personaldegastronomia.com/`
      },

      auto_return: "approved"
    };

    const result = await preference.create({ body: preferenceBody });

    return NextResponse.json({ id: result.id });

  } catch (error) {

    console.error("Error crear preferencia:", error);

    return NextResponse.json(
      { error: "Error interno", detalle: error.message },
      { status: 500 }
    );
  }
}