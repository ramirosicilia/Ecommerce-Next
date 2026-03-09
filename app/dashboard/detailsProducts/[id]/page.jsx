import {verificarCookie} from "@/app/lib/auth.js"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import {  redirect} from "next/navigation";
import ViewDetails from "../components/ViewDetails";
import {consultaImagenes, consultaUsuarios} from "../../../lib/consultation.js"
import {ProductosJoin} from "../../../lib/consultation.js"


export default async function DetalleProductosPages({params}){ 

    const {id}= await params 

    console.log(id,"aca si figura el id") 

    const cookiesStore= await cookies() 

    let usuario

    const products=await ProductosJoin() 
    const image= await consultaImagenes()
    const usuarios= await consultaUsuarios()

   const tooken= cookiesStore.get("token")?.value  

   const decoded = jwt.verify(tooken, process.env.JWT_SECRET)

    usuario = decoded.usuario

   if(!tooken){ 

    redirect("/login")

   }



   try {
  verificarCookie(tooken)
} catch {
  redirect("/login")
}





    return(

        <> 

           <ViewDetails id={id} Productos={products} Imagenes={image} usuario={usuario} usuarios={usuarios}/>



        </>
    )
}