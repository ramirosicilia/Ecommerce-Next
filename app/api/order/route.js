
import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "../../lib/DB.js";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req) {
  try {

    const body = await req.json();
    const { type, action, data } = body;
    const id = data?.id;

    console.log("📩 Webhook MercadoPago:", body);

    if (!id) {
      return NextResponse.json({ ok: true });
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    const mpResponse = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const pago = mpResponse.data;

    const {
      status,
      id: payment_id,
      transaction_amount,
      external_reference,
      metadata,
    } = pago;

    const userId = metadata?.user_id;
    const carrito = metadata?.carrito;
    const total = metadata?.total;

    // Guardar pago
    await supabase.from("pagos").insert({
      pago_id: randomUUID(),
      payment_id: Number(payment_id),
      status,
      preference_id: external_reference || null,
      transaction_amount: Number(transaction_amount),
      usuario_id: userId,
    });

    if (status !== "approved") {
      console.log("⛔ Pago no aprobado");
      return NextResponse.json({ ok: true });
    }

    if (!carrito || !userId || !total) {
      console.error("❌ metadata incompleta");
      return NextResponse.json({ error: "metadata incompleta" });
    }

    const externalReference = external_reference;

    // Guardar carrito temporal
    await supabase.from("carritos_temporales").insert({
      id: randomUUID(),
      carrito,
      total,
      external_reference: externalReference,
      user_id: userId,
      fecha_creacion: new Date().toISOString(),
    });

    // obtener carrito temporal
    const { data: carritoTemp } = await supabase
      .from("carritos_temporales")
      .select("*")
      .eq("external_reference", externalReference)
      .single();

    const carritoDb = carritoTemp.carrito;
    const totalDb = carritoTemp.total;
    const userIdDb = carritoTemp.user_id;

    // eliminar pedido duplicado
    await supabase
      .from("pedidos")
      .delete()
      .eq("preference_id", externalReference);

    // crear pedido
    const { data: pedidoInsertado } = await supabase
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

    const pedido_id = pedidoInsertado.pedido_id;

    for (const item of carritoDb) {
      const { producto_id, color_nombre, talle_nombre, cantidad, unit_price } =
        item;

      const { data: producto } = await supabase
        .from("productos")
        .select(
          `
        producto_id,
        productos_variantes (
          variante_id,
          stock,
          colores(insertar_color),
          talles(insertar_talle)
        )
      `
        )
        .eq("producto_id", producto_id)
        .single();

      const variantes = producto.productos_variantes;

      const variante = variantes.find(
        (v) =>
          (!color_nombre ||
            v.colores?.insertar_color?.toLowerCase() ===
              color_nombre.toLowerCase()) &&
          (!talle_nombre ||
            v.talles?.insertar_talle?.toLowerCase() ===
              talle_nombre.toLowerCase())
      );

      if (!variante) continue;

      const nuevoStock = variante.stock - cantidad;

      if (nuevoStock < 0) continue;

      // actualizar stock
      await supabase
        .from("productos_variantes")
        .update({ stock: nuevoStock })
        .eq("variante_id", variante.variante_id);

      // insertar detalle pedido
      await supabase.from("detalle_pedidos").insert({
        detalle_pedido_id: randomUUID(),
        pedido_id,
        variante_id: variante.variante_id,
        cantidad,
        producto_id,
        precio_unitario: unit_price,
      });
    }

    console.log("✅ Pedido creado:", pedido_id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Error webhook:", error);

    return NextResponse.json(
      { error: "internal error", detalle: error.message },
      { status: 500 }
    );
  }
}