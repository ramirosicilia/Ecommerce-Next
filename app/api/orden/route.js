import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/app/lib/supabase";
import { randomUUID } from "crypto";

export async function GET() {
  console.log("🟢 GET /api/orden funcionando");
  return NextResponse.json({ ok: true });
}

export async function POST(req) {

  console.log("🚀 [1] WEBHOOK RECIBIDO");

  try {

    console.log("📥 [2] Leyendo body raw...");
    const raw = await req.text();

    console.log("📦 [3] RAW BODY:", raw);

    let body = {};

    try {
      body = JSON.parse(raw);
      console.log("✅ [4] Body parseado:", body);
    } catch (err) {
      console.log("⚠️ [4] Body no es JSON:", err);
    }

    console.log("🔎 [5] Buscando paymentId...");

    let paymentId = null;

    if (body?.data?.id) {
      paymentId = body.data.id;
      console.log("💳 [6] paymentId desde body.data.id:", paymentId);
    }

    if (!paymentId && body?.resource) {
      paymentId = body.resource.split("/").pop();
      console.log("💳 [7] paymentId desde resource:", paymentId);
    }

    if (!paymentId && body?.id) {
      paymentId = body.id;
      console.log("💳 [8] paymentId desde body.id:", paymentId);
    }

    if (!paymentId) {
      console.log("⛔ [9] No se pudo obtener paymentId");
      return NextResponse.json({ ok: true });
    }

    console.log("💳 [10] Payment ID FINAL:", paymentId);

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    console.log("🔑 [11] Access token cargado:", !!accessToken);

    let pago;

    try {

      console.log("🌐 [12] Consultando pago en MercadoPago...");

      const mpResponse = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("📡 [13] Respuesta MercadoPago recibida");

      pago = mpResponse.data;

      console.log("📦 [14] Datos del pago:", pago);

    } catch (error) {

      console.log("⚠️ [15] Pago no encontrado o error consultando MercadoPago");
      console.log("ERROR:", error?.response?.data || error.message);

      return NextResponse.json({ ok: true });

    }

    const {
      status,
      id,
      transaction_amount,
      external_reference,
      metadata,
    } = pago;

    console.log("💰 [16] Status:", status);
    console.log("💰 [17] Payment ID:", id);
    console.log("💰 [18] Amount:", transaction_amount);
    console.log("💰 [19] External reference:", external_reference);
    console.log("💰 [20] Metadata:", metadata);

    console.log("🔎 [21] Verificando si el pago ya existe en DB...");

    const { data: pagoExistente, error: errorPagoExistente } = await supabase
      .from("pagos")
      .select("payment_id")
      .eq("payment_id", Number(id))
      .single();

    console.log("📊 [22] Resultado consulta pago existente:", pagoExistente);
    console.log("⚠️ [23] Error consulta pago existente:", errorPagoExistente);

    if (pagoExistente) {
      console.log("⚠️ [24] Pago ya procesado, abortando");
      return NextResponse.json({ ok: true });
    }

    console.log("💾 [25] Insertando pago en tabla pagos...");

    const { error: errorInsertPago } = await supabase.from("pagos").insert({
      pago_id: randomUUID(),
      payment_id: Number(id),
      status,
      preference_id: external_reference,
      transaction_amount,
      usuario_id: metadata?.user_id || null,
    });

    if (errorInsertPago) {
      console.log("❌ [26] Error insertando pago:", errorInsertPago);
    } else {
      console.log("✅ [26] Pago insertado correctamente");
    }

    if (status !== "approved") {
      console.log("⛔ [27] Pago no aprobado, se detiene el proceso");
      return NextResponse.json({ ok: true });
    }

    console.log("🛒 [28] Obteniendo metadata...");

    const carrito = metadata?.carrito ?? [];
    const total = metadata?.total ?? 0;
    const userId = metadata?.user_id ?? null;

    console.log("🛒 [29] Carrito:", carrito);
    console.log("💰 [30] Total:", total);
    console.log("👤 [31] User ID:", userId);

    console.log("📦 [32] Creando pedido...");

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
      console.log("❌ [33] Error creando pedido:", errorPedido);
      return NextResponse.json({ ok: true });
    }

    console.log("📦 [34] Pedido creado:", pedido);

    console.log("📦 [35] Insertando detalle_pedidos...");

    for (const item of carrito) {

      console.log("📦 [36] Insertando item:", item);

      const { error: errorDetalle } = await supabase
        .from("detalle_pedidos")
        .insert({
          detalle_pedido_id: randomUUID(),
          pedido_id: pedido.pedido_id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.unit_price,
        });

      if (errorDetalle) {
        console.log("❌ [37] Error insertando detalle:", errorDetalle);
      } else {
        console.log("✅ [37] Detalle insertado");
      }

    }

    console.log("🎉 [38] Pedido completo creado:", pedido.pedido_id);

    return NextResponse.json({ ok: true });

  } catch (error) {

    console.error("❌ [99] ERROR GLOBAL WEBHOOK");
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);

    return NextResponse.json({ ok: true });

  }
}