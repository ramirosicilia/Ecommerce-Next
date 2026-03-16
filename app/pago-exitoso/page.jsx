"use client"

import { useContext, useEffect } from "react"
import { createContextCart } from "../../Context/ContextoCart"

export default function PagoExitoso(){

  const { dispatch } = useContext(createContextCart)

  useEffect(() => {

    localStorage.removeItem("carrito")

    dispatch({
      type:"VACIAR_CARRITO"
    })

  }, [])

  return (
    <div>
      <h1>Pago realizado con éxito</h1>
    </div>
  )
}