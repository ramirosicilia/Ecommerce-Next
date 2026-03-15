"use client"

import {useContext } from "react"
import { createContextCart } from "../../Context/ContextoCart"

export default function PagoExitoso(){

  const { dispatch } = useContext(createContextCart)

 

    localStorage.removeItem("carrito")

    dispatch({
      type:"VACIAR_CARRITO"
    })

 
  return (
    <div>
      <h1>Pago realizado con éxito</h1>
    </div>
  )
}