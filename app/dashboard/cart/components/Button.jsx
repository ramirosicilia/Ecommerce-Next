"use client"



import styles from "../components/cart.module.css"
import { useContext, useState } from "react"
import { createContextCart } from "../../Context/ContextoCart"
import { initMercadoPago } from "@mercadopago/sdk-react"

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY)

const Button = () => {

const { state } = useContext(createContextCart)
const [loading,setLoading] = useState(false)

async function comprar() {

  try{

    setLoading(true)

    const carritoMP = state.map(prod => ({
      id: prod.variante_id,
      producto_id: prod.producto_id,
      name: prod.nombre,
      quantity: prod.cantidad,
      unit_price: prod.precio,
      color_nombre: prod.color,
      talle_nombre: prod.talle,
      user_id: prod.user_id
    }))

    const res = await fetch("/api/create_preference",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        mp: carritoMP
      })
    })

    const data = await res.json()

    if(!data.id){
      throw new Error("No se pudo crear la preferencia")
    }

    // redireccion MercadoPago
    window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.id}`

  }catch(err){

    console.error("error compra",err)

  }finally{

    setLoading(false)

  }

}

  return (

    <button
      onClick={comprar}
      className={styles.comprar}
      disabled={loading}
    >
      {loading ? "Procesando..." : "Comprar ahora"}
    </button>

  )
}

export default Button