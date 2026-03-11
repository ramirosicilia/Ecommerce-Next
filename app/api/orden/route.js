import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/app/lib/supabase";

export async function POST(req) {

  try {

    const body = await req.json();

    const { type, data } = body;
    const paymentWebhookId = data?.id;

    console.log("Webhook recibido:", body);

    if (!paymentWebhookId || type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    const mpResponse = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentWebhookId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const pago = mpResponse.data;

    const {
      id: payment_id,
      status,
      transaction_amount,
      external_reference,
      metadata
    } = pago;

    console.log("Pago obtenido:", pago);

    const carrito = metadata?.carrito;
    const userId = metadata?.user_id;
    const total = metadata?.total;

    if (!carrito || !userId) {
      console.error("Metadata incompleta");
      return NextResponse.json({ error: "Metadata incompleta" });
    }

    // -------------------------
    // INSERTAR PAGO
    // -------------------------

    await supabase.from("pagos").insert([{
      payment_id: Number(payment_id),
      status,
      preference_id: external_reference,
      transaction_amount: Number(transaction_amount),
      usuario_id: userId
    }]);

    if (status !== "approved") {
      console.log("Pago no aprobado todavía");
      return NextResponse.json({ ok: true });
    }

    // -------------------------
    // INSERTAR PEDIDO
    // -------------------------

    const { data: pedidoInsertado, error: pedidoError } = await supabase
      .from("pedidos")
      .insert([{
        usuario_id: userId,
        total: total,
        payment_id: payment_id
      }])
      .select()
      .single();

    if (pedidoError) {
      console.error("Error creando pedido:", pedidoError);
      return NextResponse.json({ error: pedidoError.message });
    }

    const pedidoID = pedidoInsertado.pedido_id;

    // -------------------------
    // INSERTAR DETALLE PEDIDOS
    // -------------------------

    const detalles = carrito.map(item => ({
      pedido_id: pedidoID,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.unit_price,
      color: item.color_nombre,
      talle: item.talle_nombre
    }));

    await supabase
      .from("detalle_pedidos")
      .insert(detalles);

    // -------------------------
    // ACTUALIZAR STOCK
    // -------------------------

    for (const item of carrito) {

      const { data: producto } = await supabase
        .from("productos")
        .select("stock")
        .eq("producto_id", item.producto_id)
        .single();

      const nuevoStock = producto.stock - item.cantidad;

      await supabase
        .from("productos")
        .update({ stock: nuevoStock })
        .eq("producto_id", item.producto_id);

    }

    // -------------------------
    // GUARDAR CARRITO TEMPORAL
    // -------------------------

    await supabase.from("carritos_temporales").insert([{
      external_reference,
      carrito,
      user_id: userId,
      total,
      fecha_creacion: new Date().toISOString()
    }]);

    // -------------------------
    // LLAMAR EMAIL
    // -------------------------

    await obtencionDataEmail(pedidoID, carrito, total, userId);

    return NextResponse.json({ ok: true });

  } catch (error) {

    console.error("Error webhook:", error);

    return NextResponse.json(
      { error: "Error interno", detalle: error.message },
      { status: 500 }
    );
  }

}