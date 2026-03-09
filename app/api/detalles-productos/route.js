import { NextResponse } from "next/server";
import { supabase } from "../../lib/DB.js";

export async function GET() {

  const detalles = await supabase.from("detalle_pedidos").select("*");

  if (!detalles.data.length) {
    return NextResponse.json({ error: "no se pudieron obtener los detalles" });
  }

  return NextResponse.json(detalles.data);
}