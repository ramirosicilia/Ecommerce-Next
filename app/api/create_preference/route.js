import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/app/lib/DB.js";

export const runtime = "nodejs";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: { timeout: 40000 }
});

const preference = new Preference(client);

export async function POST(req) {

  try {

    const { mp } = await req.json();

    if (!Array.isArray(mp) || mp.length === 0) {
      return NextResponse.json(
        { error: "No hay productos en la compra." },
        { status: 400 }
      );
    }

    for (const item of mp) {
      if (!item.producto_id) {
        return NextResponse.json(
          { error: "Algún producto no tiene producto_id." },
          { status: 400 }
        );
      }
    }

    const userId = mp[0]?.user_id;

    if (!userId) {
      return NextResponse.json(
        { error: "user_id no proporcionado" },
        { status: 400 }
      );
    }

    const carritoFormateado = mp.map(item => ({
      producto_id: item.producto_id,
      color_nombre: item.color_nombre,
      talle_nombre: item.talle_nombre,
      cantidad: item.quantity,
      unit_price: item.unit_price,
      currency_id: "ARS"
    }));


    const total = mp.reduce(
      (acc, item) =>
        acc + (Number(item.unit_price) * Number(item.quantity)),
      0
    );


    const externalReference = uuidv4();


    // 🔵 GUARDAR CARRITO TEMPORAL
    const { error: errorCarrito } = await supabase
      .from("carritos_temporales")
      .insert({
        id: uuidv4(),
        carrito: carritoFormateado,
        total,
        fecha_creacion: new Date().toISOString(),
        external_reference: externalReference,
        user_id: userId
      });

    if (errorCarrito) {
      console.log("❌ Error guardando carrito temporal:", errorCarrito);
      return NextResponse.json(
        { error: "Error guardando carrito" },
        { status: 500 }
      );
    }

    console.log("🛒 Carrito temporal guardado");


    const preferenceBody = {

      external_reference: externalReference,

      items: mp.map(item => ({
        id: item.producto_id,
        title: item.name,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        currency_id: "ARS"
      })),

      metadata: {
        user_id: userId,
        carrito: carritoFormateado,
        total
      },

      notification_url:
        "https://ecommerce-next-rose-sigma.vercel.app/api/order",

      back_urls: {
        success:
          "https://ecommerce-next-rose-sigma.vercel.app/pago-exitoso",
        failure:
          "https://ecommerce-next-rose-sigma.vercel.app/",
        pending:
          "https://ecommerce-next-rose-sigma.vercel.app/"
      },

      auto_return: "approved"
    };


    const result = await preference.create({
      body: preferenceBody
    });


    console.log("✅ Preferencia creada:", result.id);

    return NextResponse.json({
      id: result.id
    });

  } catch (error) {

    console.error("❌ Error crear preferencia:", error);

    return NextResponse.json(
      {
        error: "Error interno",
        detalle: error.message
      },
      { status: 500 }
    );

  }

}