import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/app/lib/supabase";

export async function POST(req) {

  try {

    const body = await req.json();

    const { type, action, data } = body;

    const id = data?.id;

    console.log("Webhook recibido:", body);

    if (!id || !type || !action) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    if (type !== "payment" || action !== "payment.created") {
      console.warn("Webhook ignorado");
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

    const {
      status,
      id: payment_id,
      transaction_amount,
      external_reference,
      metadata
    } = pago;

    await supabase
      .from("pagos")
      .insert([{
        payment_id: Number(payment_id),
        status,
        preference_id: external_reference || null,
        transaction_amount: Number(transaction_amount),
        usuario_id: metadata?.user_id || null
      }]);

    if (status !== "approved") {
      console.warn("Pago no aprobado");
      return NextResponse.json({ ok: true });
    }

    const carrito = metadata?.carrito;
    const userId = metadata?.user_id;
    const total = metadata?.total;

    if (!carrito || !userId || !total) {
      return NextResponse.json({ error: "Metadata incompleta" }, { status: 400 });
    }

    await supabase.from("carritos_temporales").insert([{
      external_reference,
      carrito,
      user_id: userId,
      total,
      fecha_creacion: new Date().toISOString()
    }]);

    return NextResponse.json({ ok: true });

  } catch (error) {

    console.error("Error webhook:", error);

    return NextResponse.json(
      { error: "Error interno", detalle: error.message },
      { status: 500 }
    );
  }
}