import { NextResponse } from "next/server";

export async function GET() {

  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "falta el token" });
  }

  return NextResponse.json(token);
}