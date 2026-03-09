 "use server"

import { supabase } from "@/app/lib/DB.js"
import { validacionformulario } from "../form/validations/validacionForm.js"
import bcrypt from "bcryptjs"
import type { FormState } from "@/app/types/formTypes"

export default async function createUsers(
  prevState: FormState,
  formdata: FormData
): Promise<FormState> {

  const nombres = String(formdata.get("nombre") || "")
  const apellidos = String(formdata.get("apellido") || "")
  const dnis = String(formdata.get("dni") || "")
  const emails = String(formdata.get("email") || "")
  const usuarios = String(formdata.get("usuario") || "")
  const contrasenas = String(formdata.get("contrasena") || "")

  const formObject = {
    nombre: nombres,
    apellido: apellidos,
    dni: dnis,
    email: emails,
    usuario: usuarios,
    contrasena: contrasenas
  }

  // ✅ 1️⃣ Validaciones normales
  const verificada = validacionformulario(formObject)

  if (Object.entries(verificada).length > 0) {
    return {
      success: null,
      error: verificada,
      values: {
        nombre: nombres,
        apellido: apellidos,
        dni: dnis,
        email: emails,
        usuario: usuarios
      }
    }
  }

  // ✅ 2️⃣ Verificar duplicados
  const erroresDuplicados: any = {}

  const { data: dniExist } = await supabase
    .from("usuarios")
    .select("dni")
    .eq("dni", dnis)
    .maybeSingle()

  if (dniExist) {
    erroresDuplicados.dni = "El DNI ya está registrado"
  }

  const { data: emailExist } = await supabase
    .from("usuarios")
    .select("email")
    .eq("email", emails)
    .maybeSingle()

  if (emailExist) {
    erroresDuplicados.email = "El email ya está registrado"
  }

  const { data: usuarioExist } = await supabase
    .from("usuarios")
    .select("usuario")
    .eq("usuario", usuarios)
    .maybeSingle()

  if (usuarioExist) {
    erroresDuplicados.usuario = "El usuario ya existe"
  }

  if (Object.keys(erroresDuplicados).length > 0) {
    return {
      success: null,
      error: erroresDuplicados,
      values: {
        nombre: nombres,
        apellido: apellidos,
        dni: dnis,
        email: emails,
        usuario: usuarios
      }
    }
  }

  // ✅ 3️⃣ Insertar si no existe
  const hash = await bcrypt.hash(contrasenas, 10)

  const objectBackend = {
    nombre: nombres,
    apellido: apellidos,
    dni: dnis,
    usuario: usuarios,
    email: emails,
    contrasena: hash
  }

  const { error } = await supabase
    .from("usuarios")
    .insert([objectBackend])

  if (error) {
    return {
      success: null,
      error: { general: error.message },
      values: {
        nombre: nombres,
        apellido: apellidos,
        dni: dnis,
        email: emails,
        usuario: usuarios
      }
    }
  }

  // ✅ Si todo salió bien, limpiar form
  return {
    success: "Usuario ingresado correctamente",
    error: {},
    values: {}
  }
}
