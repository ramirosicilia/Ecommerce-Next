import { NextResponse } from "next/server";
import { supabase } from "../../lib/DB.js";

export async function GET() {

  const pedidos = await supabase.from("pedidos").select("*");

  if (!pedidos.data.length) {
    return NextResponse.json({ error: "no se pudieron obtener los pedidos" });
  }

  return NextResponse.json(pedidos.data);
}