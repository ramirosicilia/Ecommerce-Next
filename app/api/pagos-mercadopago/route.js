import { NextResponse } from "next/server";
import { supabase } from "../../lib/DB.js";

export async function GET() {

  const pagosMP = await supabase.from("pagos").select("*");

  if (!pagosMP.data.length) {
    return NextResponse.json({ error: "no se pudieron obtener los pagos" });
  }

  return NextResponse.json(pagosMP.data);
}