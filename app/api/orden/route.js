import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/app/lib/supabase";
import { randomUUID } from "crypto";

// GET para probar el endpoint
export async function GET() {
  console.log("🟢 GET /api/orden funcionando");
  return NextResponse.json({ ok: true });
}

// POST webhook
export async function POST(req) {
  try {
    // Parseamos el body
    const body = await req.json();
    console.log("🚀 WEBHOOK RECIBIDO:", body);

    // RESPONDEMOS RÁPIDO a Mercado Pago
    const response = NextResponse.json({ ok: true });

    // Procesamiento pesado en segundo plano
    processWebhook(body).catch(err =>
      console.error("❌ ERROR procesando webhook en background:", err)
    );

    return response;
  } catch (err) {
    console.error("❌ ERROR global webhook:", err);
    return NextResponse.json({ ok: false });
  }
}

// Función que hace todo el procesamiento
async function processWebhook(body) {
  console.log("📦 Procesando webhook en background...");

  // Obtener paymentId
  const paymentId = body?.data?.id || body?.id || (body?.resource?.split("/").pop());
  if (!paymentId) {
    console.log("⛔ No se pudo obtener paymentId");
    return;
  }
  console.log("💳 Payment ID:", paymentId);

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.log("⛔ No hay access token de Mercado Pago");
    return;
  }

  // Consultar pago en Mercado Pago
  let pago;
  try {
    const mpResponse = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    pago = mpResponse.data;
    console.log("📦 Datos del pago:", pago);
  } catch (err) {
    console.log("⚠️ Error consultando MercadoPago:", err?.response?.data || err.message);
    return;
  }

  const { status, id, transaction_amount, external_reference, metadata } = pago;

  // Verificar si ya existe
  const { data: pagoExistente } = await supabase
    .from("pagos")
    .select("payment_id")
    .eq("payment_id", Number(id))
    .single();

  if (pagoExistente) {
    console.log("⚠️ Pago ya procesado, abortando");
    return;
  }

  // Insertar pago
  const { error: errorInsertPago } = await supabase.from("pagos").insert({
    pago_id: randomUUID(),
    payment_id: Number(id),
    status,
    preference_id: external_reference,
    transaction_amount,
    usuario_id: metadata?.user_id || null,
  });
  if (errorInsertPago) console.log("❌ Error insertando pago:", errorInsertPago);
  else console.log("✅ Pago insertado correctamente");

  if (status !== "approved") {
    console.log("⛔ Pago no aprobado, se detiene el proceso");
    return;
  }

  // Crear pedido
  const carrito = metadata?.carrito ?? [];
  const total = metadata?.total ?? 0;
  const userId = metadata?.user_id ?? null;

  const { data: pedido, error: errorPedido } = await supabase
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

  if (errorPedido) {
    console.log("❌ Error creando pedido:", errorPedido);
    return;
  }

  console.log("📦 Pedido creado:", pedido);

  // Insertar detalle de pedidos
  for (const item of carrito) {
    const { error: errorDetalle } = await supabase.from("detalle_pedidos").insert({
      detalle_pedido_id: randomUUID(),
      pedido_id: pedido.pedido_id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.unit_price,
    });
    if (errorDetalle) console.log("❌ Error insertando detalle:", errorDetalle);
    else console.log("✅ Detalle insertado:", item);
  }

  console.log("🎉 Pedido completo procesado:", pedido.pedido_id);
}