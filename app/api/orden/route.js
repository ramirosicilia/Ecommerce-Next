import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/app/lib/supabase";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req) {

  console.log("🚀 WEBHOOK RECIBIDO");

  try {

    const raw = await req.text();
    console.log("RAW:", raw);

    let body = {};

    try {
      body = JSON.parse(raw);
    } catch {
      console.log("⚠️ Body no es JSON");
    }

    const paymentId =
      body?.data?.id || body?.resource?.split("/").pop();

    if (!paymentId) {
      console.log("⚠️ No payment id");
      return NextResponse.json({ ok: true });
    }

    console.log("💳 Payment ID:", paymentId);

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    let pago;

    try {

      const mpResponse = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      pago = mpResponse.data;

    } catch (error) {

      console.log("⚠️ Pago no encontrado (test webhook)");
      return NextResponse.json({ ok: true });

    }

    const {
      status,
      id,
      transaction_amount,
      external_reference,
      metadata,
    } = pago;

    console.log("💳 Status:", status);

    // evitar duplicados
    const { data: pagoExistente } = await supabase
      .from("pagos")
      .select("payment_id")
      .eq("payment_id", Number(id))
      .single();

    if (pagoExistente) {
      console.log("⚠️ Pago ya procesado");
      return NextResponse.json({ ok: true });
    }

    await supabase.from("pagos").insert({
      pago_id: randomUUID(),
      payment_id: Number(id),
      status,
      preference_id: external_reference,
      transaction_amount,
      usuario_id: metadata?.user_id || null,
    });

    if (status !== "approved") {
      console.log("⛔ Pago no aprobado");
      return NextResponse.json({ ok: true });
    }

    const carrito = metadata?.carrito ?? [];
    const total = metadata?.total ?? 0;
    const userId = metadata?.user_id ?? null;

    const { data: pedido } = await supabase
      .from("pedidos")
      .insert({
        pedido_id: randomUUID(),
        usuario_id: userId,
        total,
        estado: "pagado",
        preference_id: external_reference,
        fecha_creacion: new Date().toISOString(),
      })
      .select("pedido_id")
      .single();

    if (!pedido) return NextResponse.json({ ok: true });

    for (const item of carrito) {

      await supabase.from("detalle_pedidos").insert({
        detalle_pedido_id: randomUUID(),
        pedido_id: pedido.pedido_id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.unit_price,
      });

    }

    console.log("✅ Pedido creado:", pedido.pedido_id);

    return NextResponse.json({ ok: true });

  } catch (error) {

    console.error("❌ Webhook error:", error);
    return NextResponse.json({ ok: true });

  }
}