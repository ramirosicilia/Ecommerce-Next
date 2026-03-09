
"use client"

import { useEffect, useReducer } from "react"
import { ReducerCart } from "../reducer/reducerCart.js"

export const useReducerCart = () => {

  const [state, dispatch] = useReducer(ReducerCart, [])

  // cargar carrito desde localStorage
  useEffect(() => {

    const carrito = localStorage.getItem("carrito")

    if (carrito) {
      dispatch({
        type: "cargar",
        payload: JSON.parse(carrito)
      })
    }

  }, [])

  // guardar carrito cuando cambia
  useEffect(() => {

    localStorage.setItem("carrito", JSON.stringify(state))

  }, [state])

  return { state, dispatch }
}