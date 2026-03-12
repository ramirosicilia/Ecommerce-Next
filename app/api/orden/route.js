import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/app/lib/supabase";
import { randomUUID } from "crypto";

export async function GET() {
  console.log("🟢 GET webhook funcionando");
  return NextResponse.json({ ok: true });
}

export async function POST(req) {

  console.log("🚀 WEBHOOK INICIADO");

  try {

    const body = await req.json().catch(() => null);

    console.log("📩 Webhook MercadoPago BODY:", body);

    if (!body) {
      console.error("❌ Body vacío");
      return NextResponse.json({ ok: true });
    }

    const { type, action, data } = body;

    console.log("📦 type:", type);
    console.log("📦 action:", action);
    console.log("📦 data:", data);

   const id = body?.data?.id;

    if (!id) {
      console.warn("⚠️ No hay payment id");
      return NextResponse.json({ ok: true });
    }

    console.log("💳 Payment ID recibido:", id);

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN; 


    if (!accessToken) {
      console.error("❌ ACCESS TOKEN NO DEFINIDO");
      return NextResponse.json({ ok: true });
    }

    console.log("🔑 Access token OK");

    console.log("📡 Consultando API MercadoPago...");

    const mpResponse = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    ); 

 if (body?.type !== "payment") {
  console.log("⚠️ Evento ignorado:", body?.type)
  return NextResponse.json({ ok: true })
}
    console.log("✅ Respuesta MercadoPago recibida");

    const pago = mpResponse?.data;

    console.log("📄 Pago completo:", pago);

    const {
      status,
      id: payment_id,
      transaction_amount,
      external_reference,
      metadata,
    } = pago;

    console.log("💳 status:", status);
    console.log("💳 payment_id:", payment_id);
    console.log("💳 transaction_amount:", transaction_amount);
    console.log("💳 external_reference:", external_reference);
    console.log("💳 metadata:", metadata);

    const userId = metadata?.user_id;
    const carrito = metadata?.carrito;
    const total = metadata?.total;

    console.log("👤 userId:", userId);
    console.log("🛒 carrito:", carrito);
    console.log("💰 total:", total);

    console.log("💾 Guardando pago en base de datos...");

    const { error: pagoError } = await supabase.from("pagos").insert({
      pago_id: randomUUID(),
      payment_id: Number(payment_id),
      status,
      preference_id: external_reference || null,
      transaction_amount: Number(transaction_amount),
      usuario_id: userId,
    });

    if (pagoError) {
      console.error("❌ Error guardando pago:", pagoError);
    } else {
      console.log("✅ Pago guardado");
    }

    if (status !== "approved") {
      console.log("⛔ Pago no aprobado, se detiene flujo");
      return NextResponse.json({ ok: true });
    }

    if (!metadata) {
  console.log("⚠️ metadata vacía");
  return NextResponse.json({ ok: true });
}

    const externalReference = external_reference;

    console.log("🧾 externalReference:", externalReference);

    console.log("💾 Guardando carrito temporal...");

    const { error: carritoError } = await supabase
      .from("carritos_temporales")
      .insert({
        id: randomUUID(),
        carrito,
        total,
        external_reference: externalReference,
        user_id: userId,
        fecha_creacion: new Date().toISOString(),
      });

    if (carritoError) {
      console.error("❌ Error guardando carrito temporal:", carritoError);
    } else {
      console.log("✅ Carrito temporal guardado");
    }

    console.log("🔎 Buscando carrito temporal...");

    const { data: carritoTemp, error: carritoTempError } = await supabase
      .from("carritos_temporales")
      .select("*")
      .eq("external_reference", externalReference)
      .single();

    if (carritoTempError) {
      console.error("❌ Error obteniendo carrito temporal:", carritoTempError);
    }

    if (!carritoTemp) {
      console.error("❌ carrito temporal no encontrado");
      return NextResponse.json({ ok: true });
    }

    console.log("✅ carrito temporal encontrado:", carritoTemp);

    const carritoDb = carritoTemp.carrito;
    const totalDb = carritoTemp.total;
    const userIdDb = carritoTemp.user_id;

    console.log("🛒 carritoDb:", carritoDb);
    console.log("💰 totalDb:", totalDb);
    console.log("👤 userIdDb:", userIdDb);

    console.log("🧹 Eliminando pedidos duplicados...");

    await supabase
      .from("pedidos")
      .delete()
      .eq("preference_id", externalReference);

    console.log("✅ pedidos duplicados eliminados");

    console.log("🧾 Creando pedido...");

    const { data: pedidoInsertado, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        pedido_id: randomUUID(),
        usuario_id: userIdDb,
        total: totalDb,
        estado: "pagado",
        preference_id: externalReference,
        fecha_creacion: new Date().toISOString(),
      })
      .select("pedido_id")
      .single();

    if (pedidoError) {
      console.error("❌ Error creando pedido:", pedidoError);
      return NextResponse.json({ ok: true });
    }

    const pedido_id = pedidoInsertado.pedido_id;

    console.log("✅ Pedido creado:", pedido_id);

    console.log("🔄 Procesando carrito...");

    for (const item of carritoDb) {

      console.log("🛒 Item:", item);

      const { producto_id, color_nombre, talle_nombre, cantidad, unit_price } =
        item;

      console.log("🔎 Buscando producto:", producto_id);

      const { data: producto, error: productoError } = await supabase
        .from("productos")
        .select(`
          producto_id,
          productos_variantes (
            variante_id,
            stock,
            colores(insertar_color),
            talles(insertar_talle)
          )
        `)
        .eq("producto_id", producto_id)
        .single();

      if (productoError) {
        console.error("❌ Error obteniendo producto:", productoError);
        continue;
      }

      if (!producto) {
        console.error("❌ producto no encontrado");
        continue;
      }

      console.log("📦 producto encontrado:", producto);

      const variantes = producto?.productos_variantes || [];

      console.log("🎨 variantes:", variantes);

      const variante = variantes.find(
        (v) =>
          (!color_nombre ||
            v.colores?.insertar_color?.toLowerCase() ===
              color_nombre.toLowerCase()) &&
          (!talle_nombre ||
            v.talles?.insertar_talle?.toLowerCase() ===
              talle_nombre.toLowerCase())
      );

      if (!variante) {
        console.warn("⚠️ variante no encontrada");
        continue;
      }

      console.log("✅ variante encontrada:", variante);

      const nuevoStock = variante.stock - cantidad;

      console.log("📦 stock actual:", variante.stock);
      console.log("📦 nuevo stock:", nuevoStock);

      if (nuevoStock < 0) {
        console.warn("⚠️ stock insuficiente");
        continue;
      }

      console.log("🔄 actualizando stock...");

      const { error: stockError } = await supabase
        .from("productos_variantes")
        .update({ stock: nuevoStock })
        .eq("variante_id", variante.variante_id);

      if (stockError) {
        console.error("❌ Error actualizando stock:", stockError);
      } else {
        console.log("✅ stock actualizado");
      }

      console.log("🧾 insertando detalle pedido...");

      const { error: detalleError } = await supabase
        .from("detalle_pedidos")
        .insert({
          detalle_pedido_id: randomUUID(),
          pedido_id,
          variante_id: variante.variante_id,
          cantidad,
          producto_id,
          precio_unitario: unit_price,
        });

      if (detalleError) {
        console.error("❌ Error insertando detalle:", detalleError);
      } else {
        console.log("✅ detalle pedido insertado");
      }

    }

    console.log("🎉 Pedido procesado completamente:", pedido_id);

    return NextResponse.json({ ok: true });

  } catch (error) {

  console.error("❌ Error webhook FATAL:", error)
  console.error("❌ Stack:", error.stack)

  return NextResponse.json({
    ok: true
  })

}
}