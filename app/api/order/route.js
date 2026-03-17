
import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/app/lib/supabase";
import { randomUUID } from "crypto";

// GET para probar el endpoint
export async function GET() {
  console.log("🟢 GET /api/order funcionando");
  return NextResponse.json({ ok: true });
}

// POST webhook
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

    if (queryId && !body?.data?.id) {
      body.data = { id: queryId };
    }

    console.log("🚀 WEBHOOK RECIBIDO:", body);

    const response = NextResponse.json({ ok: true }, { status: 200 });

    processWebhook(body).catch(err =>
      console.error("❌ ERROR background:", err)
    );

    return response;

  } catch (err) {
    console.error("❌ ERROR global:", err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

// 🔥 PROCESAMIENTO REAL
async function processWebhook(body) {
  console.log("📦 Procesando webhook...");

  const paymentId =
    body?.data?.id ||
    body?.id ||
    body?.resource?.split("/").pop();

  if (!paymentId) {
    console.log("⛔ No paymentId");
    return;
  }

  console.log("💳 Payment ID:", paymentId);

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) return;

  // 🔎 Obtener pago
  let pago;
  try {
    const mpResponse = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    pago = mpResponse.data;
  } catch (err) {
    console.log("❌ Error MP:", err?.response?.data || err.message);
    return;
  }

  const {
    status,
    id,
    transaction_amount,
    external_reference,
    metadata,
  } = pago;

  // 🧠 1. ANTI DUPLICADO HARD
  const { data: pagoExistente } = await supabase
    .from("pagos")
    .select("payment_id")
    .eq("payment_id", Number(id))
    .maybeSingle();

  if (pagoExistente) {
    console.log("⚠️ Pago ya procesado");
    return;
  }

  // 🧠 2. SOLO PAGOS APROBADOS
  if (status !== "approved") {
    console.log("⛔ Pago rechazado/no aprobado → no se guarda");
    return;
  }

  // 💾 Insertar pago
  const { error: errorInsertPago } = await supabase.from("pagos").insert({
    pago_id: randomUUID(),
    payment_id: Number(id),
    status,
    preference_id: external_reference,
    transaction_amount,
    usuario_id: metadata?.user_id || null,
  });

  if (errorInsertPago) {
    console.log("❌ Error pago:", errorInsertPago);
    return;
  }

  console.log("✅ Pago guardado");

  // 📦 Datos carrito
  const carrito = metadata?.carrito ?? [];
  const total = metadata?.total ?? 0;
  const userId = metadata?.user_id ?? null;

  if (!external_reference || !userId) {
    console.log("❌ Falta metadata");
    return;
  }

  // 🧠 3. CARRITO TEMPORAL (SIN DUPLICAR)
  const { data: carritoExistente } = await supabase
    .from("carritos_temporales")
    .select("id")
    .eq("external_reference", external_reference)
    .maybeSingle();

  if (!carritoExistente) {
    const { error: errorCarrito } = await supabase
      .from("carritos_temporales")
      .insert({
        id: randomUUID(),
        external_reference,
        carrito,
        user_id: userId,
        total,
        fecha_creacion: new Date().toISOString(),
      });

    if (errorCarrito) {
      console.log("❌ Error carrito:", errorCarrito);
      return;
    }

    console.log("🛒 Carrito temporal guardado");
  } else {
    console.log("⚠️ Carrito ya existía");
  }

  // 🧠 4. PEDIDO DUPLICADO CHECK
  const { data: pedidoExistente } = await supabase
    .from("pedidos")
    .select("pedido_id")
    .eq("preference_id", external_reference)
    .maybeSingle();

  if (pedidoExistente) {
    console.log("⚠️ Pedido ya existe");
    return;
  }

  // 🧾 Crear pedido
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
    console.log("❌ Error pedido:", errorPedido);
    return;
  }

  console.log("📦 Pedido creado:", pedido.pedido_id);

  // 📄 Detalles + stock (opcional si querés expandir después)
  for (const item of carrito) {
    const { error: errorDetalle } = await supabase
      .from("detalle_pedidos")
      .insert({
        detalle_pedido_id: randomUUID(),
        pedido_id: pedido.pedido_id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        variante_id: item.variante_id,
        precio_unitario: item.unit_price,
      });

    if (errorDetalle) {
      console.log("❌ Error detalle:", errorDetalle);
    }
  }

  console.log("🎉 Pedido procesado completo:", pedido.pedido_id);
}