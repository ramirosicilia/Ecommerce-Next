import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/app/lib/supabase";
import { randomUUID } from "crypto";

export async function POST(req) {
  try {

    const body = await req.json();
    const { type, data } = body;

    if (type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const paymentWebhookId = data?.id;

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    const mpResponse = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentWebhookId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const pago = mpResponse.data;

    const {
      status,
      id: payment_id,
      transaction_amount,
      external_reference,
      metadata
    } = pago;

    const userId = metadata?.user_id;
    const carrito = metadata?.carrito;
    const total = metadata?.total;

    if (!userId || !carrito || !total) {
      return NextResponse.json({ error: "metadata incompleta" });
    }

    const pedidoId = randomUUID();

    // 1️⃣ Guardar pago
    await supabase.from("pagos").insert({
      payment_id,
      status,
      preference_id: external_reference,
      transaction_amount,
      usuario_id: userId
    });

    // 2️⃣ Crear pedido
    await supabase.from("pedidos").insert({
      pedido_id: pedidoId,
      usuario_id: userId,
      total,
      estado: "pagado",
      preference_id: external_reference
    });

    // 3️⃣ Insertar detalle pedidos
    const detalles = carrito.map((item) => ({
      detalle_pedido_id: randomUUID(),
      pedido_id: pedidoId,
      producto_id: item.producto_id,
      variante_id: item.variante_id,
      cantidad: item.cantidad,
      precio_unitario: item.unit_price
    }));

    await supabase.from("detalle_pedidos").insert(detalles);

    // 4️⃣ Guardar carrito temporal
    await supabase.from("carritos_temporales").insert({
      id: randomUUID(),
      carrito,
      total,
      external_reference,
      user_id: userId,
      fecha_creacion: new Date().toISOString()
    });

    return NextResponse.json({ ok: true });

  } catch (error) {

    console.error("error webhook:", error);

    return NextResponse.json(
      { error: "internal error", detalle: error.message },
      { status: 500 }
    );
  }
}