import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "../../lib/DB.js";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {

  try {

    const body = await req.json();

    const { type, action, data } = body;
    const id = data?.id;

    console.log("Webhook recibido:", body);

    if (!id || !type || !action) {
      return NextResponse.json({ error: "Faltan datos en el webhook" }, { status: 400 });
    }

    if (type !== "payment" || action !== "payment.created") {
      return NextResponse.json({ ok: true });
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    const mpResponse = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const pago = mpResponse.data;

    const { status, id: payment_id, transaction_amount, external_reference, metadata } = pago;

    await supabase.from("pagos").insert([{
      pago_id: uuidv4(),
      payment_id: Number(payment_id),
      status,
      preference_id: external_reference || null,
      transaction_amount: Number(transaction_amount),
      usuario_id: metadata?.user_id || null
    }]);

    if (status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    const carrito = metadata?.carrito;
    const userId = metadata?.user_id;
    const total = metadata?.total;

    await supabase.from("carritos_temporales").insert([{
      external_reference,
      carrito,
      user_id: userId,
      total,
      fecha_creacion: new Date().toISOString()
    }]);

    return NextResponse.json({ ok: true });

  } catch (error) {

    console.error("Webhook error:", error);

    return NextResponse.json(
      { error: "Error interno", detalle: error.message },
      { status: 500 }
    );
  }
}