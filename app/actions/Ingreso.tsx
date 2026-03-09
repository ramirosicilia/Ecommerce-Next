"use server";

import { LoginState } from "../types/formTypes";
import { supabase } from "@/app/lib/DB.js";
import bcrypt from "bcryptjs";
import { validacionLogin } from "../login/validations/validacionLogin.js";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {getToken} from "@/app/lib/auth.js"



export default async function Ingreso(
  prevState: LoginState,
  formdata: FormData
): Promise<LoginState> {
  const usuarios = String(formdata.get("usuario") || "");
  const contrasenas = String(formdata.get("contrasena") || "");

  const formObject = {
    usuario: usuarios,
    contrasena: contrasenas,
  };

  const verificada = validacionLogin(formObject);

  if (Object.entries(verificada).length > 0) {
    return {
      success: null,
      error: verificada,
      values: {
        usuario: usuarios,
        contrasena: contrasenas,
      },
    };
  }

  const { data: user, error } = await supabase
    .from("usuarios")
    .select("usuario, contrasena")
    .eq("usuario", formObject.usuario)
    .maybeSingle();

  if (error) {
    return {
      success: null,
      error: { general: "Error en la base de datos" },
      values: {
        usuario: usuarios,
        contrasena: contrasenas,
      },
    };
  }

  if (!user) {
    return {
      success: null,
      error: { usuario: "Usuario no existe" },
      values: {
        usuario: usuarios,
        contrasena: contrasenas,
      },
    };
  }

  const passwordCorrecta = await bcrypt.compare(
    formObject.contrasena,
    user.contrasena
  );

  if (!passwordCorrecta) {
    return {
      success: null,
      error: { contrasena: "Contraseña incorrecta" },
      values: {
        usuario: usuarios,
        contrasena: contrasenas,
      },
    };
  }    

  const token=getToken({usuario:user.usuario}) 


  const cookieStore= await cookies()


   cookieStore.set("token",token,{
   httpOnly: true,
     secure: process.env.NODE_ENV === "production",
     sameSite: "lax",
     path: '/',
   })
   



    redirect("/dashboard")




  

  // LOGIN CORRECTO
 
}
