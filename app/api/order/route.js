
import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/app/lib/supabase";
import { randomUUID } from "crypto";

// GET
export async function GET() {
  return NextResponse.json({ ok: true });
}

// POST webhook
export async function POST(req) {
  try {
    const body = await req.json();

    console.log("🚀 WEBHOOK:", body);

    processWebhook(body).catch(err =>
      console.error("❌ ERROR BACKGROUND:", err)
    );

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("❌ ERROR GLOBAL:", err);
    return NextResponse.json({ ok: true });
  }
}

// PROCESO
async function processWebhook(body) {
  console.log("📦 Procesando...");

  const paymentId =
    body?.data?.id || body?.id || body?.resource?.split("/").pop();

  if (!paymentId) {
    console.log("⛔ Sin paymentId");
    return;
  }

  console.log("💳 Payment:", paymentId);

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  const { data: pagoMP } = await axios.get(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  console.log("📦 MP:", pagoMP.status);

  const {
    status,
    id,
    transaction_amount,
    external_reference,
    metadata,
  } = pagoMP;

  // 🚫 SOLO PROCESAR APROBADOS
  if (status !== "approved") {
    console.log("⛔ NO aprobado:", status);
    return;
  }

  // 🛒 ===============================
  // 🛒 CARRITO TEMPORAL (NUEVO)
  // 🛒 ===============================
  const carrito = metadata?.carrito ?? [];
  const total = metadata?.total ?? 0;
  const userId = metadata?.user_id ?? null;

  if (!external_reference || !userId) {
    console.log("❌ Falta metadata carrito");
    return;
  }

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
        carrito,
        total,
        user_id: userId,
        external_reference,
        fecha_creacion: new Date().toISOString(),
      });

    if (errorCarrito) {
      console.log("❌ Error carrito:", errorCarrito);
      return;
    }

    console.log("🛒 Carrito temporal guardado");
  } else {
    console.log("⚠️ Carrito ya existe");
  }

  // 🚫 EVITAR DUPLICADO DE PAGO
  const { data: pagoExistente } = await supabase
    .from("pagos")
    .select("payment_id")
    .eq("payment_id", Number(id))
    .maybeSingle();

  if (pagoExistente) {
    console.log("⚠️ Pago duplicado");
    return;
  }

  // ✅ INSERT PAGO
  const { error: errorPago } = await supabase.from("pagos").insert({
    pago_id: randomUUID(),
    payment_id: Number(id),
    status,
    preference_id: external_reference,
    transaction_amount,
    usuario_id: metadata?.user_id || null,
  });

  if (errorPago) {
    console.log("❌ Error pago:", errorPago);
    return;
  }

  console.log("✅ Pago guardado");

  // 🚫 EVITAR PEDIDO DUPLICADO
  const { data: pedidoExistente } = await supabase
    .from("pedidos")
    .select("pedido_id")
    .eq("preference_id", external_reference)
    .maybeSingle();

  if (pedidoExistente) {
    console.log("⚠️ Pedido duplicado");
    return;
  }

  // ✅ CREAR PEDIDO
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

  console.log("📦 Pedido:", pedido.pedido_id);

  // ✅ DETALLE
  for (const item of carrito) {
    const { error } = await supabase
      .from("detalle_pedidos")
      .insert({
        detalle_pedido_id: randomUUID(),
        pedido_id: pedido.pedido_id,
        producto_id: item.producto_id,
        variante_id: item.variante_id,
        cantidad: item.cantidad,
        precio_unitario: item.unit_price,
      });

    if (error) {
      console.log("❌ Error detalle:", error);
    }
  }

  console.log("🎉 TODO OK");
}