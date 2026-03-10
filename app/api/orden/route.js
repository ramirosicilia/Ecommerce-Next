import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/app/lib/DB.js";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {

  try {

    const body = await req.json();

    console.log("📩 Webhook MercadoPago:", body);

    const { type, data } = body;

    if (type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = data?.id;

    if (!paymentId) {
      return NextResponse.json({ error: "payment id missing" }, { status: 400 });
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    const mpResponse = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const pago = mpResponse.data;

    const {
      id,
      status,
      transaction_amount,
      external_reference,
      metadata
    } = pago;

    console.log("💰 Pago:", pago);

    // evitar duplicados
    const { data: pagoExistente } = await supabase
      .from("pagos")
      .select("*")
      .eq("payment_id", id)
      .maybeSingle();

    if (pagoExistente) {
      console.log("⚠️ Pago ya procesado");
      return NextResponse.json({ ok: true });
    }

    await supabase.from("pagos").insert([
      {
        pago_id: uuidv4(),
        payment_id: Number(id),
        status,
        preference_id: external_reference,
        transaction_amount: Number(transaction_amount),
        usuario_id: metadata?.user_id || null
      }
    ]);

    if (status !== "approved") {
      console.log("⛔ Pago no aprobado");
      return NextResponse.json({ ok: true });
    }

    const carrito = metadata?.carrito;
    const userId = metadata?.user_id;
    const total = metadata?.total;

    if (!carrito || !userId) {
      console.log("❌ metadata incompleta");
      return NextResponse.json({ ok: true });
    }

    // crear pedido
    const { data: pedido, error: errorPedido } = await supabase
      .from("pedidos")
      .insert([
        {
          usuario_id: userId,
          total,
          estado: "pagado",
          preference_id: external_reference,
          fecha_creacion: new Date().toISOString()
        }
      ])
      .select("pedido_id")
      .single();

    if (errorPedido) {
      console.error("❌ Error pedido:", errorPedido);
      return NextResponse.json({ ok: true });
    }

    const pedido_id = pedido.pedido_id;

    for (const item of carrito) {

      const {
        producto_id,
        color_nombre,
        talle_nombre,
        cantidad,
        unit_price
      } = item;

      const { data: producto } = await supabase
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
        .maybeSingle();

      const variantes = producto?.productos_variantes || [];

      const variante = variantes.find(v =>
        (!color_nombre ||
          v.colores?.insertar_color?.toLowerCase() === color_nombre.toLowerCase()) &&
        (!talle_nombre ||
          v.talles?.insertar_talle?.toLowerCase() === talle_nombre.toLowerCase())
      );

      if (!variante) {
        console.log("⚠️ Variante no encontrada");
        continue;
      }

      const nuevoStock = variante.stock - cantidad;

      if (nuevoStock < 0) {
        console.log("⚠️ stock insuficiente");
        continue;
      }

      await supabase
        .from("productos_variantes")
        .update({ stock: nuevoStock })
        .eq("variante_id", variante.variante_id);

      await supabase.from("detalle_pedidos").insert([
        {
          pedido_id,
          variante_id: variante.variante_id,
          cantidad,
          producto_id,
          precio_unitario: unit_price
        }
      ]);
    }

    console.log("✅ Pedido creado:", pedido_id);

    return NextResponse.json({ ok: true });

  } catch (error) {

    console.error("❌ Webhook error:", error);

    return NextResponse.json(
      { error: "internal error", detalle: error.message },
      { status: 500 }
    );
  }
}