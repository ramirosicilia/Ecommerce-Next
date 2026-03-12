"use client"

import { useEffect } from "react"

export default function PagoExitoso(){

  useEffect(()=>{

    localStorage.removeItem("carrito") 
     

  },[]) 



  return (
    <div>
      <h1>Pago realizado con éxito</h1>
    </div>
  )
}