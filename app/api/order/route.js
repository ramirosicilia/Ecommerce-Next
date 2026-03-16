
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/app/lib/supabase";
import { randomUUID } from "crypto";


// TEST ENDPOINT
export async function GET() {
  console.log("🟢 GET /api/order funcionando");
  return NextResponse.json({ ok: true });
}


// WEBHOOK
export async function POST(req) {

  try {

    let body = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const url = new URL(req.url);

    const queryId = url.searchParams.get("id");
    const topic =
      url.searchParams.get("topic") ||
      url.searchParams.get("type");

    // MercadoPago a veces manda solo query
    if (queryId && !body?.data?.id) {
      body = {
        type: topic || "payment",
        data: { id: queryId }
      };
    }

    console.log("🚀 WEBHOOK RECIBIDO:", body);

    const response = NextResponse.json({ ok: true }, { status: 200 });

    processWebhook(body).catch(err =>
      console.error("❌ ERROR procesando webhook:", err)
    );

    return response;

  } catch (err) {

    console.error("❌ ERROR GLOBAL WEBHOOK:", err);

    return NextResponse.json({ ok: true }, { status: 200 });

  }

}


// PROCESAMIENTO
async function processWebhook(body) {

  console.log("📦 Procesando webhook...");

  const paymentId =
    body?.data?.id ||
    body?.id ||
    body?.resource?.split("/")?.pop();

  if (!paymentId) {
    console.log("⛔ No se pudo obtener paymentId");
    return;
  }

  console.log("💳 Payment ID:", paymentId);

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    console.log("⛔ Falta MERCADO_PAGO_ACCESS_TOKEN");
    return;
  }

  let pago;

  try {

    const mpResponse = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    pago = mpResponse.data;

  } catch (err) {

    console.log(
      "⚠️ Error consultando MercadoPago:",
      err?.response?.data || err.message
    );

    return;
  }

  const {
    status,
    id,
    transaction_amount,
    external_reference,
    metadata
  } = pago;

  console.log("📦 Datos del pago:", pago);
  console.log("STATUS DEL PAGO:", status);


  // VERIFICAR DUPLICADO
  const { data: pagoExistente } = await supabase
    .from("pagos")
    .select("payment_id")
    .eq("payment_id", Number(id))
    .maybeSingle();

  if (pagoExistente) {
    console.log("⚠️ Pago ya procesado");
    return;
  }


  // INSERTAR PAGO
  const { error: errorInsertPago } = await supabase
    .from("pagos")
    .insert({
      pago_id: randomUUID(),
      payment_id: Number(id),
      status,
      preference_id: external_reference,
      transaction_amount,
      usuario_id: metadata?.user_id || null
    });

  if (errorInsertPago) {
    console.log("❌ Error insertando pago:", errorInsertPago);
    return;
  }

  console.log("✅ Pago guardado");


  // SOLO CONTINUAR SI ESTÁ APROBADO
  if (status !== "approved") {
    console.log("⛔ Pago no aprobado:", status);
    return;
  }


  const carrito = metadata?.carrito ?? [];
  const total = metadata?.total ?? 0;
  const userId = metadata?.user_id ?? null;


  // CREAR PEDIDO
  const { data: pedido, error: errorPedido } = await supabase
    .from("pedidos")
    .insert({
      pedido_id: randomUUID(),
      usuario_id: userId,
      total,
      estado: "pagado",
      preference_id: external_reference,
      fecha_creacion: new Date().toISOString()
    })
    .select("pedido_id")
    .single();

  if (errorPedido) {
    console.log("❌ Error creando pedido:", errorPedido);
    return;
  }

  console.log("📦 Pedido creado:", pedido);


  // INSERTAR DETALLES
  for (const item of carrito) {

    const { error: errorDetalle } = await supabase
      .from("detalle_pedidos")
      .insert({
        detalle_pedido_id: randomUUID(),
        pedido_id: pedido.pedido_id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.unit_price
      });

    if (errorDetalle)
      console.log("❌ Error detalle:", errorDetalle);
    else
      console.log("✅ Detalle insertado:", item);

  }

  console.log("🎉 Pedido completo:", pedido.pedido_id);

}